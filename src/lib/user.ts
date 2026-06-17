const STORAGE_KEY = "hub_user_name";

export function getUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setUserName(name: string) {
  localStorage.setItem(STORAGE_KEY, name.trim());
}
