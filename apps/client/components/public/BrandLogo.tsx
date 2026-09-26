import Image from "next/image";

type Props = {
  className?: string;
  /** Rendered height in px — width is derived from each logo's own aspect. */
  height?: number;
  priority?: boolean;
};

// logo.png (dark-theme wordmark) is already cropped tight to its content.
const DARK_W = 875;
const DARK_H = 116;
const DARK_ASPECT = DARK_W / DARK_H;

// c_white.png (light-theme wordmark, transparent background) ships on a big
// 1920x1080 canvas with the mark + text occupying a band across the middle,
// not cropped to the wordmark like logo.png is — so it's cropped here via a
// clipping wrapper instead of being stretched into the logo's usual slot.
// The box below is the image's opaque bounding box (158,429)-(1760,648)
// plus a little padding — nudge it if the crop ever looks off.
const LIGHT_SRC_W = 1920;
const LIGHT_SRC_H = 1080;
const LIGHT_CROP = { x: 150, y: 421, w: 1618, h: 235 };
const LIGHT_ASPECT = LIGHT_CROP.w / LIGHT_CROP.h;

export default function BrandLogo({ className = "", height = 18, priority }: Props) {
  const darkWidth = Math.round(height * DARK_ASPECT);
  const lightWidth = Math.round(height * LIGHT_ASPECT);

  return (
    <>
      <Image
        src="/logo.png"
        alt="Candleweb"
        width={darkWidth}
        height={height}
        className={`brand-logo-dark ${className}`}
        priority={priority}
      />
      <span
        className={`brand-logo-light ${className}`}
        style={{ position: "relative", overflow: "hidden", width: lightWidth, height, verticalAlign: "middle" }}
      >
        <Image
          src="/c_white.png"
          alt="Candleweb"
          width={LIGHT_SRC_W}
          height={LIGHT_SRC_H}
          priority={priority}
          style={{
            position: "absolute",
            left: `${-(LIGHT_CROP.x / LIGHT_CROP.w) * 100}%`,
            top: `${-(LIGHT_CROP.y / LIGHT_CROP.h) * 100}%`,
            width: `${(LIGHT_SRC_W / LIGHT_CROP.w) * 100}%`,
            height: `${(LIGHT_SRC_H / LIGHT_CROP.h) * 100}%`,
            maxWidth: "none",
          }}
        />
      </span>
    </>
  );
}
