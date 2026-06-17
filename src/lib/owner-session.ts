export function setOwnerSession(projectId: number, password: string) {
  sessionStorage.setItem(`hub-owner-${projectId}`, password);
  window.dispatchEvent(new Event(`hub-owner-change-${projectId}`));
}

export function clearOwnerSession(projectId: number) {
  sessionStorage.removeItem(`hub-owner-${projectId}`);
  window.dispatchEvent(new Event(`hub-owner-change-${projectId}`));
}

export function getOwnerSession(projectId: number): string | null {
  return sessionStorage.getItem(`hub-owner-${projectId}`);
}
