import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  label: string;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Desktop: a small panel anchored under the trigger button.
 * Mobile (<720px): becomes a bottom sheet, matching the dashboard-focus design.
 */
export default function Popover({
  open,
  onClose,
  anchorRef,
  label,
  title,
  headerRight,
  footer,
  children,
}: Props) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const isSheet = window.innerWidth < 720;
      setSheet(isSheet);
      if (isSheet || !anchorRef.current) {
        setStyle({});
        return;
      }
      const r = anchorRef.current.getBoundingClientRect();
      setStyle({
        top: Math.round(r.bottom + 10),
        right: Math.round(window.innerWidth - r.right),
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fx-popscrim" onClick={onClose} />
      <div
        className={`fx-pop ${sheet ? "sheet9" : ""}`}
        style={style}
        role="dialog"
        aria-label={label}
      >
        {(title || headerRight) && (
          <div className="fx-poph">
            <div>{title}</div>
            {headerRight}
          </div>
        )}
        <div className="fx-popb">{children}</div>
        {footer && <div className="fx-popf">{footer}</div>}
      </div>
    </>
  );
}
