import { ALLOWED_IMAGE_TYPES } from "@/lib/image-mime";

const MAX_SIZE = 5 * 1024 * 1024;

export function getBlobReadWriteToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export async function createBlobClientToken(pathname: string): Promise<string> {
  const token = getBlobReadWriteToken();
  if (!token) {
    throw new Error("Blob Storage 토큰이 없습니다.");
  }

  const { generateClientTokenFromReadWriteToken } = await import("@vercel/blob/client");
  return generateClientTokenFromReadWriteToken({
    token,
    pathname,
    allowedContentTypes: [...ALLOWED_IMAGE_TYPES, "image/jpg"],
    maximumSizeInBytes: MAX_SIZE,
  });
}
