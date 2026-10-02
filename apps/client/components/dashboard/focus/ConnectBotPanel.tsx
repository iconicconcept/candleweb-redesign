import Link from "next/link";
import { useState } from "react";
import { writeClipboard } from "../../../lib/hooks/useClipboard";
import { error } from "../../alert/Toast";

/**
 * The panel that makes a trade usable. A user's bot needs exactly three
 * things from Candleweb, and the user should leave the create-trade flow with
 * all three in front of them:
 *
 *   1. the pull URL  (GET)  — where the bot gets candles
 *   2. the decision URL (POST) — where the bot sends what it decided
 *   3. the bot's developer key — which proves the bot is theirs
 *
 * Two rules this component exists to enforce:
 *
 *  - **The URLs are used exactly as the API returned them.** They are never
 *    assembled from the trade id: the host differs between sandbox and
 *    production, and the trade response already carries the right one.
 *  - **The header is named next to the key.** A key with no
 *    `X-Candleweb-Key` beside it is the likeliest support ticket from this
 *    screen.
 *
 * Render nothing on a CandleAI trade — both URLs are `null` there and there
 * is no bot to connect.
 */

type Props = {
  /** `candles_url` from the trade response, used verbatim. */
  candlesUrl: string | null;
  /** `decision_url` from the trade response, used verbatim. */
  decisionUrl: string | null;
  /** `dev_key` from `GET /bots/<id>/` — it belongs to the bot, not the trade,
   *  because one bot can serve many trades. */
  devKey?: string | null;
  botId?: number | null;
  botName?: string | null;
  /** A paused bot's key is refused with 401 "This bot is paused." */
  botPaused?: boolean;
  heading?: string;
  intro?: string;
};

/** Show enough of the key to recognise it, hide the rest. It is a credential:
 *  anyone holding it can post decisions as this bot. */
const maskKey = (key: string): string =>
  key.length > 11 ? `${key.slice(0, 11)}${"•".repeat(14)}` : key;

const ConnectBotPanel = ({
  candlesUrl,
  decisionUrl,
  devKey,
  botId,
  botName,
  botPaused,
  heading = "Connect your bot",
  intro,
}: Props) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [keyShown, setKeyShown] = useState(false);

  // Hidden entirely on a CandleAI trade — nothing to wire up.
  if (!candlesUrl && !decisionUrl) return null;

  const copy = async (field: string, value?: string | null) => {
    if (!value) return;
    if (await writeClipboard(value)) {
      setCopied(field);
      setTimeout(() => setCopied((f) => (f === field ? null : f)), 1500);
    } else {
      error("Couldn't copy — select it by hand");
    }
  };

  return (
    <div className="fx-epbox">
      <div className="fx-sh" style={{ marginTop: 0 }}>
        <h2>
          {heading}{" "}
          {botName && <span className="sub2">{botName}</span>}
        </h2>
        {botId != null && (
          <Link className="fx-link" href={`/dashboard/bots/${botId}`}>
            Open the bot →
          </Link>
        )}
      </div>
      {intro && (
        <p className="fx-epnote" style={{ marginTop: 0, marginBottom: 14 }}>
          {intro}
        </p>
      )}

      <div className="fx-ep2">
        <div className="eh2">
          <span className="fx-mv g4">GET</span>
          <b>Pull candles</b>
          <small>
            Where your bot fetches the candles and the indicators you picked. Paste it into an n8n
            HTTP Request node, a Make module, or your own code.
          </small>
        </div>
        <div className="eb2">
          <code>{candlesUrl}</code>
          <button className="fx-mini" type="button" onClick={() => copy("candles", candlesUrl)}>
            {copied === "candles" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="fx-ep2">
        <div className="eh2">
          <span className="fx-mv p4">POST</span>
          <b>Send decisions</b>
          <small>
            Where your bot posts buy, sell or hold. One decision per fetch — to change its mind, it
            fetches again. Nothing is bought or sold from this; Candleweb records what your bot
            decided.
          </small>
        </div>
        <div className="eb2">
          <code>{decisionUrl}</code>
          <button className="fx-mini" type="button" onClick={() => copy("decision", decisionUrl)}>
            {copied === "decision" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="fx-ep2">
        <div className="eh2">
          <span className="fx-mv p4">KEY</span>
          <b>Developer key</b>
          <small>
            Proves the bot is yours. Send it on both calls above as the header{" "}
            <code>X-Candleweb-Key</code>.
          </small>
        </div>
        <div className="eb2">
          <code>
            {devKey
              ? keyShown
                ? devKey
                : maskKey(devKey)
              : botId != null
                ? "— loading the bot's key —"
                : "— assign a bot to this trade —"}
          </code>
          {devKey && (
            <>
              <button className="fx-mini" type="button" onClick={() => setKeyShown((v) => !v)}>
                {keyShown ? "Hide" : "Show"}
              </button>
              <button className="fx-mini" type="button" onClick={() => copy("key", devKey)}>
                {copied === "key" ? "Copied" : "Copy"}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="fx-epnote">
        <b>Send the key as a header.</b> Both calls need{" "}
        <code>X-Candleweb-Key: &lt;your key&gt;</code>. Treat it as a password — anyone holding it
        can post decisions as this bot. If you regenerate it from the bot&rsquo;s settings, the old
        key stops working at once on <em>every</em> trade that bot serves; these two URLs do not
        change.
      </p>

      {botPaused && (
        <p className="fx-failmsg">
          <b>This bot is paused.</b> Its key is refused while it is paused — both calls above answer
          401 until you resume it.
        </p>
      )}
    </div>
  );
};

export default ConnectBotPanel;
