/**
 * The card/crypto choice, for use inside a dashboard `Dialog`.
 *
 * The subscription page has asked this before every plan change and review
 * purchase for a while; the Academy shop did not, and went straight to the
 * processor. This is that same chooser as one component so the two cannot
 * drift apart. The public pages need their own copy — see
 * components/public/PaymentMethodModal — because these `.fx-*` styles read
 * tokens that only exist inside `.fx-root`.
 *
 * Crypto is shown and disabled on purpose: people ask whether they can pay in
 * USDT, and an option marked "Soon" answers that better than its absence.
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

/** `what` is the one sentence that differs per purchase. */
export default function PayMethodChoice({ what }: { what: string }) {
  return (
    <>
      <div className="fx-pays pick9">
        <button type="button" className="fx-pay9 on9" aria-pressed="true">
          <span className="pi9">
            <CardGlyph />
          </span>
          <span className="pt9">
            <b>Pay with card</b>
            <span>In naira. Card, bank transfer or USSD.</span>
          </span>
          <span className="pc9" aria-hidden="true">
            <Tick />
          </span>
        </button>
        <button type="button" className="fx-pay9" disabled aria-disabled="true">
          <span className="pi9">
            <CoinGlyph />
          </span>
          <span className="pt9">
            <b>Pay with crypto</b>
            <span>USDT or USDC, from any wallet or exchange.</span>
          </span>
          <span className="pc9">Soon</span>
        </button>
      </div>
      <p className="fx-dwarn">
        You&rsquo;ll finish on the processor&rsquo;s secure checkout, then come back here. {what}{" "}
        Either way your trading funds stay on your own exchange &mdash; this pays for the
        platform, nothing else.
      </p>
    </>
  );
}
