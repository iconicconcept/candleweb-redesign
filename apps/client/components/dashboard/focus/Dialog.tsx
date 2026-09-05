import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  tone?: "teal" | "amber";
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  labelledBy: string;
};

/** Generic scrim + dialog, shared across the dashboard-focus pages. */
export default function Dialog({
  open,
  onClose,
  tone = "teal",
  icon,
  title,
  subtitle,
  children,
  footer,
  labelledBy,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fx-scrim" onClick={onClose} />
      <div className="fx-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div
          className={`fx-dlg ${tone === "amber" ? "warn9" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <button
            className="fx-dclose"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <div className="dh">
            {icon && (
              <span className={`fx-dtick ${tone === "amber" ? "amber9" : ""}`}>
                {icon}
              </span>
            )}
            <h2 id={labelledBy}>{title}</h2>
            {subtitle && <p className="dsub">{subtitle}</p>}
          </div>
          {children && <div className="db">{children}</div>}
          {footer && <div className="df">{footer}</div>}
        </div>
      </div>
    </>
  );
}
