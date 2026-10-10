/*
============================================================
Shrinks a photo in the browser before it is uploaded.

Phone photos are several MB each; the server accepts far
less per request, and the magazine never shows them larger
than this anyway.
============================================================
*/

const SKIP_TYPES = ["image/gif", "image/svg+xml"];

const loadImage = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      // Keeps portrait phone photos upright
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
    } catch (error) {
      // Fall through to the <img> loader
    }
  }

  const url = URL.createObjectURL(file);

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export async function compressImage(
  file,
  { maxSize = 1600, quality = 0.82 } = {}
) {
  if (
    !(file instanceof File) ||
    !file.type.startsWith("image/") ||
    SKIP_TYPES.includes(file.type)
  ) {
    return file;
  }

  try {
    const image = await loadImage(file);

    const scale = Math.min(
      1,
      maxSize / Math.max(image.width, image.height)
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext("2d");

    // JPEG has no transparency
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    image.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    // Already small enough: keep the original
    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg" }
    );
  } catch (error) {
    console.error("Image could not be compressed:", error);

    return file;
  }
}
