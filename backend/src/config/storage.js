import "dotenv/config";

import crypto from "crypto";
import sharp from "sharp";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import cloudinary from "./cloudinary.js";
import { WATERMARK } from "./watermark.js";
import { WATERMARK_IMAGE } from "./watermarkImage.js";

/*
=====================================================
IMAGE STORAGE
=====================================================

New images go to Cloudflare R2 when its settings are
present in the environment; otherwise to Cloudinary.

Images uploaded to Cloudinary earlier keep working
and can still be deleted.
=====================================================
*/

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env;

// Public address of the bucket, without a trailing slash
const R2_PUBLIC_URL = String(
  process.env.R2_PUBLIC_URL || ""
).replace(/\/+$/, "");

export const usesR2 = Boolean(
  R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET &&
    R2_PUBLIC_URL
);

const r2 = usesR2
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;


/*
=====================================================
PREPARE IMAGE
=====================================================

Turns any uploaded picture into an upright JPEG of a
sensible size, and stamps the watermark on magazine
images so no clean copy is ever stored.
=====================================================
*/

const CONTENT_MAX_SIZE = 1600;
const PORTRAIT_MAX_SIZE = 800;

// Watermark width as a share of the image width
const WATERMARK_SHARE = 0.4;

const prepareImage = async (buffer, watermark) => {
  const maxSize = watermark
    ? CONTENT_MAX_SIZE
    : PORTRAIT_MAX_SIZE;

  const resized = await sharp(buffer)
    .rotate()
    .resize({
      width: maxSize,
      height: maxSize,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .toBuffer({ resolveWithObject: true });

  let image = sharp(resized.data);

  if (watermark) {
    const { width, height } = resized.info;

    const stamp = await sharp(WATERMARK_IMAGE)
      .resize({
        width: Math.max(
          1,
          Math.round(width * WATERMARK_SHARE)
        ),
      })
      .toBuffer({ resolveWithObject: true });

    const margin = Math.round(width * 0.02);

    image = image.composite([
      {
        input: stamp.data,
        left: Math.max(
          0,
          width - stamp.info.width - margin
        ),
        top: Math.max(
          0,
          height - stamp.info.height - margin
        ),
      },
    ]);
  }

  return image.jpeg({ quality: 85 }).toBuffer();
};


/*
=====================================================
UPLOAD IMAGE
=====================================================

Returns the public address of the stored image.
=====================================================
*/

// Stores ready bytes in R2 and returns their public address
export const storeInR2 = async (key, body, contentType) => {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // The name is unique, so the image never changes
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
};

const uploadToCloudinary = (file, folder, watermark) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        ...(watermark && { transformation: WATERMARK }),
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    stream.end(file.buffer);
  });
};

export const uploadImage = async (
  file,
  folder,
  { watermark = false } = {}
) => {
  if (!usesR2) {
    return uploadToCloudinary(file, folder, watermark);
  }

  return storeInR2(
    `${folder}/${crypto.randomUUID()}.jpg`,
    await prepareImage(file.buffer, watermark),
    "image/jpeg"
  );
};


/*
=====================================================
DELETE IMAGE
=====================================================

A failed delete never blocks the request; the stored
image is simply left behind.
=====================================================
*/

const getCloudinaryPublicId = (url) => {
  const match = url.match(
    /\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/
  );

  return match ? match[1] : null;
};

export const deleteImage = async (url) => {
  if (!url) return;

  try {
    if (usesR2 && url.startsWith(`${R2_PUBLIC_URL}/`)) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: url.slice(R2_PUBLIC_URL.length + 1),
        })
      );

      return;
    }

    if (url.includes("res.cloudinary.com")) {
      const publicId = getCloudinaryPublicId(url);

      if (publicId) {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
      }
    }
  } catch (error) {
    console.error("IMAGE DELETE ERROR:", error);
  }
};
