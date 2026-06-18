import { OgSiteImage } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "UI Project Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return OgSiteImage();
}
