import { useState, memo } from "react";
import { useSolar } from "@/components/SolarLayout";

interface ExerciseThumbnailProps {
  name: string;
  index: number;
  /** MuscleWiki resolved media */
  media?: { video?: string; image?: string };
  /** Direct image_url from DB (e.g. curated_exercises gif_url) */
  imageUrl?: string | null;
  /** Whether media is still loading */
  mediaLoading?: boolean;
  /** Size in Tailwind units — default 12 (48px) */
  size?: "10" | "12" | "14";
}

/**
 * Reusable exercise thumbnail with shimmer loading, image/video-poster fallback,
 * and graceful degradation to exercise number.
 */
const ExerciseThumbnail = ({
  name,
  index,
  media,
  imageUrl,
  mediaLoading = false,
  size = "12",
}: ExerciseThumbnailProps) => {
  const s = useSolar();
  const [imgError, setImgError] = useState(false);

  const sizeClass = `w-${size} h-${size}`;
  const thumbSrc = media?.image || imageUrl || null;
  const videoSrc = media?.video || null;

  // Determine what to show
  const showShimmer = mediaLoading && !thumbSrc && !videoSrc;
  const showMedia = !imgError && (thumbSrc || videoSrc);

  if (showShimmer) {
    return (
      <div
        className={`${sizeClass} rounded-xl shrink-0 overflow-hidden shimmer-loading`}
        style={{ border: `1px solid ${s.cardBorder}` }}
      />
    );
  }

  if (showMedia) {
    // Prefer image, fallback to video poster frame
    const src = thumbSrc || undefined;
    return (
      <div
        className={`${sizeClass} rounded-xl overflow-hidden shrink-0 bg-card`}
        style={{ border: `1px solid ${s.cardBorder}` }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : videoSrc ? (
          <video
            src={videoSrc}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onError={() => setImgError(true)}
          />
        ) : null}
      </div>
    );
  }

  // Fallback: number badge
  return (
    <div
      className={`${sizeClass} rounded-xl flex items-center justify-center text-sm shrink-0 font-display`}
      style={{
        fontWeight: 800,
        background: `${s.orange}12`,
        color: s.orange,
        border: `1px solid ${s.cardBorder}`,
      }}
    >
      {index + 1}
    </div>
  );
};

export default ExerciseThumbnail;
