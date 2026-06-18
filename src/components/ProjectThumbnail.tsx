import Image from "next/image";
import { getDisplayThumbnail } from "@/lib/thumbnail-display";

interface ProjectThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

/** data URL 등 Next/Image가 처리 못하는 소스는 img로 렌더 */
export default function ProjectThumbnail({ src, alt, className = "object-cover" }: ProjectThumbnailProps) {
  const imageSrc = getDisplayThumbnail(src);
  const fillClass = `absolute inset-0 h-full w-full ${className}`;

  if (imageSrc.startsWith("data:")) {
    return <img src={imageSrc} alt={alt} className={fillClass} />;
  }

  return <Image src={imageSrc} alt={alt} fill className={className} unoptimized />;
}
