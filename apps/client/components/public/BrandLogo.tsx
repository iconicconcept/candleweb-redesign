import Image from "next/image";

type Props = {
  className?: string;
  /** Rendered height in px — width is derived from the logo's own aspect. */
  height?: number;
  priority?: boolean;
};

// public/brand/logo-*.png are trimmed to the artwork (no transparent
// padding) and share one aspect, so both theme variants fill the same box.
// Source files: public/Candleweb-logo-for-{dark,white}-backgrounds.png.
const SRC_W = 960;
const SRC_H = 150;
const ASPECT = SRC_W / SRC_H;

/** Shared wordmark: light-text logo on dark, dark-text logo on light. The
    theme toggle in public-shell.css shows the right one. */
export default function BrandLogo({ className = "", height = 18, priority }: Props) {
  const width = Math.round(height * ASPECT);

  return (
    <>
      <Image
        src="/brand/logo-dark-bg.png"
        alt="Candleweb"
        width={width}
        height={height}
        className={`brand-logo-dark ${className}`}
        priority={priority}
      />
      <Image
        src="/brand/logo-light-bg.png"
        alt="Candleweb"
        width={width}
        height={height}
        className={`brand-logo-light ${className}`}
        priority={priority}
      />
    </>
  );
}
