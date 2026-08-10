import { imageSources } from "../lib/images";

/**
 * A gallery image with a WebP srcset and a JPEG floor.
 *
 * `<picture>` carries `display: contents` so it contributes nothing to layout
 * — the <img> stays a direct layout child of whatever wrapper it had before,
 * which is what keeps the existing `absolute inset` and `h-full` rules working
 * unchanged.
 */
export function ProductImage({
  base,
  alt,
  sizes,
  width,
  height,
  className = "",
  loading = "lazy",
  fetchPriority,
}) {
  const { webpSrcSet, fallbackSrc } = imageSources(base);

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        decoding="async"
        fetchpriority={fetchPriority}
        className={className}
      />
    </picture>
  );
}
