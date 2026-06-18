import { randomUUID } from "crypto";
import { getFirebaseApp } from "./firebase-admin";

function buildDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/** Firebase Storage에 업로드. 실패 시 null (Storage 미설정 등) */
export async function uploadToFirebaseStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (process.env.VERCEL && !bucketName) {
    return null;
  }

  try {
    const { getStorage } = await import("firebase-admin/storage");
    const bucket = bucketName
      ? getStorage(getFirebaseApp()).bucket(bucketName)
      : getStorage(getFirebaseApp()).bucket();

    const objectPath = `uploads/${filename}`;
    const token = randomUUID();

    await withTimeout(
      bucket.file(objectPath).save(buffer, {
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      }),
      8000
    );

    return buildDownloadUrl(bucket.name, objectPath, token);
  } catch (error) {
    console.error("Firebase Storage upload failed:", error);
    return null;
  }
}
