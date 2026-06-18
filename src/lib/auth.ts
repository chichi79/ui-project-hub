import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 64;

export const DEFAULT_PROJECT_PASSWORD = "1111";

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const input = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, "hex");
  if (input.length !== expected.length) return false;
  return timingSafeEqual(input, expected);
}

export function validatePasswordInput(password: unknown): string | null {
  if (typeof password !== "string" || !password.trim()) {
    return "비밀번호를 입력해 주세요.";
  }
  if (password.length < 4) {
    return "비밀번호는 4자 이상이어야 합니다.";
  }
  return null;
}
