import { RecommendationV2 } from "../../../types/tradingV2";
import {
  settingTargetLabel,
  settingValueLabel,
} from "../../../lib/botRecommendationsV2";

/**
 * "What to change", for one recommendation — the diff or the before → after.
 *
 * Split out because the apply dialog shows the same block again, and the one
 * thing a confirmation must not do is describe the change differently from
 * the row it was opened from.
 */

const ICON = {
  prompt: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16M4 10h10M4 15h16M4 20h8" />
    </svg>
  ),
  setting: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </svg>
  ),
};

export const KIND_LABEL: Record<string, string> = {
  PROMPT: "Prompt edit",
  SETTING: "Bot setting",
};

export default function ReviewChange({ rec }: { rec: RecommendationV2 }) {
  const change = rec.change;
  if (!change) return null;
  const isPrompt = change.kind === "PROMPT";
  const rows = change.trades ?? [];

  return (
    <div className="chg">
      <div className="chg-h">
        <b>
          {change.applies_to?.trim() ||
            (isPrompt ? "Edit the prompt" : "Change the setting")}
        </b>
        <span className="kind">
          {isPrompt ? ICON.prompt : ICON.setting}
          {KIND_LABEL[change.kind ?? ""] ?? "Change"}
        </span>
      </div>

      {/* A prompt change is a diff. Either half can be absent — a pure
          addition has nothing to remove, a pure removal nothing to put in
          its place — so neither line is drawn empty. */}
      {isPrompt && (
        <div className="diff">
          {change.remove?.trim() && <div className="del">{change.remove.trim()}</div>}
          {change.replace?.trim() && <div className="add">{change.replace.trim()}</div>}
        </div>
      )}

      {/* A setting change is a before → after per trade. `current` is read
          now, so it is right even if the trade was edited after the review. */}
      {!isPrompt &&
        rows.map((t, i) => (
          <div className="set" key={t.trade_id ?? `s-${i}`}>
            <span className="nm">{settingTargetLabel(t.target ?? change.target)}</span>
            {t.exists === false ? (
              <span className="v from">Trade deleted</span>
            ) : (
              <>
                <span className="v from">{settingValueLabel(t.current)}</span>
                <span className="ar">→</span>
                <span className="v to">
                  {settingValueLabel(t.suggested ?? change.suggested)}
                </span>
              </>
            )}
            <span className="nm" style={{ minWidth: 0 }}>
              {t.trade_name || `Trade #${t.trade_id}`}
              {t.mode === "LIVE" ? " · Live" : ""}
            </span>
          </div>
        ))}

      {/* Candleweb cannot edit the bot — it runs on the user's own platform
          and never receives a prompt from us. The division of labour has to
          be said on the change itself, not only in the button's wording. */}
      {isPrompt && (
        <div className="howto">
          {ICON.info}
          <span>
            <b>You apply prompt changes yourself.</b> Candleweb can&rsquo;t edit your
            bot&rsquo;s prompt. Copy the new text into your workflow, then mark it applied
            here so the next review knows.
          </span>
        </div>
      )}

      {/* Only prompt changes restart the counter, and the backend says which
          do — showing this on a setting change would warn about something
          that is not going to happen. */}
      {change.restarts_review_count && (
        <div className="caveat">
          <span aria-hidden="true">⚠</span>
          <span>
            Applying this starts the review count again — results before and after a
            change have to stay separate.
          </span>
        </div>
      )}
    </div>
  );
}
