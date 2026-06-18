import Image from "next/image";
import { getDisplayThumbnail } from "@/lib/thumbnail-display";

interface ProjectThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** false면 부모 크기에 맞는 block 이미지 */
  fill?: boolean;
}

/** data URL 등 Next/Image가 처리 못하는 소스는 img로 렌더 */
export default function ProjectThumbnail({
  src,
  alt,
  className = "object-cover",
  fill = true,
}: ProjectThumbnailProps) {
  const imageSrc = getDisplayThumbnail(src);

  if (fill) {
    const fillClass = `absolute inset-0 h-full w-full ${className}`;
    if (imageSrc.startsWith("data:")) {
      return <img src={imageSrc} alt={alt} className={fillClass} />;
    }
    return <Image src={imageSrc} alt={alt} fill className={className} unoptimized />;
  }

  const blockClass = `h-full w-full ${className}`;
  if (imageSrc.startsWith("data:")) {
    return <img src={imageSrc} alt={alt} className={blockClass} />;
  }
  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={320}
      height={200}
      className={blockClass}
      unoptimized
    />
  );
}
