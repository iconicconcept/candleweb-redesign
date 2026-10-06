import { useEffect } from "react";

/**
 * "How would you like to pay?" for the market-facing pages.
 *
 * The dashboard asks this before every subscription and review purchase; the
 * public pages took money without ever asking, so a course enrolment and a
 * plan jumped straight to the card processor. This is the same question in the
 * public pages' own dialog shell — the dashboard's version is built on
 * `.fx-*` tokens that only exist inside `.fx-root`, so it cannot be reused
 * here without the colours falling back to transparent.
 *
 * Crypto is deliberately present and deliberately disabled: people ask whether
 * they can pay in USDT, and an option marked "Soon" answers that better than
 * its absence does.
 */

const CardGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="6.5" width="18" height="12" rx="2.6" />
    <path d="M3 10.5h18M16.5 14.5h1.5" />
  </svg>
);

const CoinGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.4 8.2h4a2.2 2.2 0 010 4.4h-4M9.4 12.6h4.4a2.2 2.2 0 010 4.4H9.4M9.4 6.6v12M11.6 5.2v2M11.6 18.6v2" />
  </svg>
);

const Tick = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6.5 9.2 17.3 4 12.1" />
  </svg>
);

type Props = {
  /** What is being bought, e.g. "Builder · ₦10,000 a month". */
  summary: string;
  /** What happens after the processor sends them back. */
  note: string;
  busy?: boolean;
  continueLabel?: string;
  onCancel: () => void;
  onContinue: () => void;
};

export default function PaymentMethodModal({
  summary,
  note,
  busy,
  continueLabel = "Continue",
  onCancel,
  onContinue,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onCancel, busy]);

  return (
    <div
      className="ac-cd-scrim"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        className="ac-cd-dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-method-title"
      >
        <button
          type="button"
          className="ac-cd-x"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 id="pay-method-title">How would you like to pay?</h2>
        <p className="ac-cd-dsub">{summary}</p>

        <div className="ac-pm-list">
          {/* Not a radio group: there is one choice to make today, and a
              disabled second option. Marking the live one `aria-pressed` keeps
              it honest for a screen reader without implying a choice that
              cannot yet be made. */}
          <button type="button" className="ac-pm on" aria-pressed="true">
            <span className="ac-pm-i">
              <CardGlyph />
            </span>
            <span className="ac-pm-t">
              <b>Pay with card</b>
              <span>In naira. Card, bank transfer or USSD.</span>
            </span>
            <span className="ac-pm-c" aria-hidden="true">
              <Tick />
            </span>
          </button>
          <button type="button" className="ac-pm" disabled aria-disabled="true">
            <span className="ac-pm-i">
              <CoinGlyph />
            </span>
            <span className="ac-pm-t">
              <b>Pay with crypto</b>
              <span>USDT or USDC, from any wallet or exchange.</span>
            </span>
            <span className="ac-pm-soon">Soon</span>
          </button>
        </div>

        <p className="ac-pm-note">{note}</p>

        <div className="ac-cd-dacts">
          <button
            type="button"
            className="pub-btn pub-btn-glass"
            onClick={onCancel}
            disabled={busy}
          >
            Not now
          </button>
          <button
            type="button"
            className="pub-btn pub-btn-amber"
            onClick={onContinue}
            disabled={busy}
          >
            {busy ? "Opening checkout…" : continueLabel} <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
