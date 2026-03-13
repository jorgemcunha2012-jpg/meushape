import { ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Original image source */
  src: string;
  /** WebP version (auto-derived if not provided for local assets) */
  webpSrc?: string;
  /** Whether this is above-the-fold / critical */
  eager?: boolean;
}

/**
 * Renders a <picture> element with WebP source and fallback.
 * Uses loading="lazy" by default, override with eager for critical images.
 */
const OptimizedImage = ({
  src,
  webpSrc,
  eager = false,
  alt = "",
  className,
  style,
  width,
  height,
  ...rest
}: OptimizedImageProps) => {
  // For external URLs, skip <picture> wrapper
  const isExternal = src.startsWith("http");
  
  if (isExternal || !webpSrc) {
    return (
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        className={className}
        style={style}
        width={width}
        height={height}
        {...rest}
      />
    );
  }

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        className={className}
        style={style}
        width={width}
        height={height}
        {...rest}
      />
    </picture>
  );
};

export default OptimizedImage;
