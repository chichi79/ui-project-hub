export const DEFAULT_THUMBNAIL = "/images/default-project.svg";

export function getDisplayThumbnail(thumbnail: string | null | undefined): string {
  return thumbnail?.trim() || DEFAULT_THUMBNAIL;
}
