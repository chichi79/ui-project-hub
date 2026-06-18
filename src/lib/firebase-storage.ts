import { randomUUID } from "crypto";
import { getStorage } from "firebase-admin/storage";
import { getFirebaseApp } from "./firebase-admin";

function buildDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

/** Firebase Storage에 업로드. 실패 시 null (Storage 미설정 등) */
export async function uploadToFirebaseStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim();
    const bucket = bucketName
      ? getStorage(getFirebaseApp()).bucket(bucketName)
      : getStorage(getFirebaseApp()).bucket();

    const objectPath = `uploads/${filename}`;
    const token = randomUUID();

    await bucket.file(objectPath).save(buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    return buildDownloadUrl(bucket.name, objectPath, token);
  } catch (error) {
    console.error("Firebase Storage upload failed:", error);
    return null;
  }
}
