/*
=====================================================
MOVE EXISTING IMAGES FROM CLOUDINARY TO R2
=====================================================

Run once, after the R2 settings are in .env:

    npm run move-images

Each Cloudinary image is copied to R2 unchanged (it is
already watermarked) and the magazine content is pointed
at the new address. Nothing is deleted from Cloudinary.
It is safe to run again: images already moved are skipped.
=====================================================
*/

import "dotenv/config";

import path from "path";
import mongoose from "mongoose";

import MagazineContent from "../src/models/MagazineContent.js";
import { storeInR2, usesR2 } from "../src/config/storage.js";

const IMAGE_FIELDS = [
  ["eventPhoto", "kpt-emagazine/magazine/events"],
  ["student.photo", "kpt-emagazine/magazine/students"],
  ["faculty.photo", "kpt-emagazine/magazine/faculty"],
];

if (!usesR2) {
  console.error(
    "R2 settings are missing in .env. Nothing was moved."
  );

  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

let moved = 0;
let failed = 0;

for (const content of await MagazineContent.find()) {
  for (const [field, folder] of IMAGE_FIELDS) {
    const url = content.get(field);

    if (!url || !url.includes("res.cloudinary.com")) {
      continue;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Cloudinary answered ${response.status}`);
      }

      // Same file name as on Cloudinary, so a second run overwrites
      const newUrl = await storeInR2(
        `${folder}/${path.basename(new URL(url).pathname)}`,
        Buffer.from(await response.arrayBuffer()),
        response.headers.get("content-type") || "image/jpeg"
      );

      content.set(field, newUrl);

      await content.save();

      moved++;

      console.log(`moved   ${content.title} (${field})`);
    } catch (error) {
      failed++;

      console.error(
        `FAILED  ${content.title} (${field}): ${error.message}`
      );
    }
  }
}

console.log(`\n${moved} image(s) moved, ${failed} failed.`);

await mongoose.disconnect();

process.exit(failed ? 1 : 0);
