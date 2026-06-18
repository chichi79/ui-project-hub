import sharp from "sharp";

/** Firestore 문서 크기를 고려한 data URL용 목표 바이트 */
export const DATA_URL_TARGET_BYTES = 280_000;

export async function compressImageForStorage(
  buffer: Buffer
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const meta = await sharp(buffer).metadata();

  if (meta.format === "gif" && buffer.length <= DATA_URL_TARGET_BYTES) {
    return { buffer, ext: "gif", contentType: "image/gif" };
  }

  let quality = 82;
  let maxSide = 1280;
  let compressed = buffer;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    compressed = await sharp(buffer)
      .rotate()
      .resize({
        width: maxSide,
        height: maxSide,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (compressed.length <= DATA_URL_TARGET_BYTES) {
      return { buffer: compressed, ext: "jpg", contentType: "image/jpeg" };
    }

    quality -= 10;
    if (quality < 55) {
      quality = 82;
      maxSide = Math.floor(maxSide * 0.8);
    }
  }

  return { buffer: compressed, ext: "jpg", contentType: "image/jpeg" };
}
