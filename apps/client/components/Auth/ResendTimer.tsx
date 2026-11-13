import useCooldown from "../../lib/hooks/useCooldown";

const RING = 56.55; // 2πr for r = 9

/** "Didn't get it?  ◔ Resend in 0:42" → "Resend link" once the cooldown ends. */
export default function ResendTimer({
  prompt,
  action,
  cooldown,
  sending,
  onResend,
}: {
  prompt: string;
  action: string;
  cooldown: ReturnType<typeof useCooldown>;
  sending: boolean;
  onResend: () => void;
}) {
  return (
    <div className="auth-well">
      <span>{prompt}</span>
      {cooldown.running ? (
        <span className="auth-timer">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle className="track" cx="11" cy="11" r="9" fill="none" strokeWidth="2.5" />
            <circle
              className="ring"
              cx="11"
              cy="11"
              r="9"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={(RING * cooldown.progress).toFixed(2)}
            />
          </svg>
          <span>
            Resend in <strong>{cooldown.label}</strong>
          </span>
        </span>
      ) : (
        <button type="button" className="auth-linkbtn" disabled={sending} onClick={onResend}>
          {sending ? "Sending…" : action}
        </button>
      )}
    </div>
  );
}
