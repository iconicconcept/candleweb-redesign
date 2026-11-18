import { normaliseType } from "./notificationTriggers";

/**
 * Sound for the two trade events, and only those two:
 *
 *  - a bot placed a trade  → notification "Bot order placed" → trade-opened
 *  - a trade was closed     → notification "Position closed"  → trade-closed
 *
 * The dashboard has no push channel, so these ride the unread-notification
 * poll (`useNotificationPoll`), which already sees every new notification on
 * every dashboard page. Nothing else in the notification list makes a sound.
 *
 * Two browser rules shape this file:
 *
 *  - Autoplay. A page may only play audio after the user has interacted with
 *    it. Chrome/Firefox remember any click or key for the whole document;
 *    iOS Safari instead needs each <audio> element to have been started once
 *    inside a gesture. `primeTradeSounds` covers both: on the first tap,
 *    click or key it starts each sound muted and stops it straight away.
 *  - A failed play() is not an error worth showing — the notification is
 *    still in the bell — so every play is allowed to fail silently.
 */

type TradeSound = "opened" | "closed";

const SOURCES: Record<TradeSound, string> = {
  opened: "/sounds/candleweb-ember-trade-opened.mp3",
  closed: "/sounds/candleweb-ember-trade-closed.mp3",
};

/* Keyed by `normaliseType`, the same loose matching the trigger table uses,
   so "Bot order placed", "BOT_ORDER_PLACED" etc. all hit. */
const SOUND_FOR_TYPE: Record<string, TradeSound> = {
  botorderplaced: "opened",
  positionclosed: "closed",
};

const players: Partial<Record<TradeSound, HTMLAudioElement>> = {};

const player = (kind: TradeSound): HTMLAudioElement | null => {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  let audio = players[kind];
  if (!audio) {
    audio = new Audio(SOURCES[kind]);
    audio.preload = "auto";
    players[kind] = audio;
  }
  return audio;
};

const UNLOCK_EVENTS = ["pointerdown", "touchend", "click", "keydown"] as const;
let primed = false;

/** Preload both sounds and unlock them on the user's first interaction.
    Safe to call repeatedly; only the first call does anything. */
export const primeTradeSounds = () => {
  if (primed || typeof window === "undefined") return;
  primed = true;
  (Object.keys(SOURCES) as TradeSound[]).forEach((kind) => player(kind));

  const unlock = () => {
    UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
    (Object.keys(SOURCES) as TradeSound[]).forEach((kind) => {
      const audio = player(kind);
      if (!audio || !audio.paused) return;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => undefined)
        .finally(() => {
          audio.muted = false;
        });
    });
  };
  UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
};

/* One sound at a time: a fill and a close landing in the same poll play one
   after the other instead of on top of each other. */
const queue: TradeSound[] = [];
let playing = false;

const playNext = () => {
  const kind = queue.shift();
  const audio = kind ? player(kind) : null;
  if (!kind || !audio) {
    playing = false;
    queue.length = 0;
    return;
  }
  playing = true;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    audio.removeEventListener("ended", done);
    audio.removeEventListener("error", done);
    playNext();
  };
  /* `ended` never fires if playback stalls; don't let that block the queue. */
  const safety = setTimeout(done, 8000);
  audio.addEventListener("ended", done);
  audio.addEventListener("error", done);
  try {
    audio.currentTime = 0;
  } catch {
    /* not seekable yet — it is at the start anyway */
  }
  audio.muted = false;
  const started = audio.play();
  if (started) started.catch(done);
};

const enqueue = (kinds: TradeSound[]) => {
  kinds.forEach((k) => {
    if (!queue.includes(k)) queue.push(k);
  });
  if (!playing) playNext();
};

/**
 * The newest notification id already accounted for, per signed-in user.
 *
 * Module-level rather than per component, so moving between dashboard pages
 * (each remounts the poll) neither replays an old event nor skips one that
 * arrived during the navigation. `null` until the first poll of the session,
 * which only SEEDS it: notifications already unread when the dashboard opens
 * happened earlier and must not all sound at once.
 */
let heard: { who: string; id: number } | null = null;

/* When this page load began. The first poll runs ~15s after the dashboard
   opens, so a trade placed or closed in that window is already in the list
   when the watermark is seeded — anything created after this moment still
   sounds on that first poll. */
const PAGE_OPENED_AT = Date.now();

type Row = {
  id?: number | string | null;
  notification_type?: string | null;
  /* typed as Date in types/notification, but it arrives as a JSON string */
  created_at?: string | Date | null;
};

/** Feed every poll's unread rows through here; it sounds the new trade events. */
export const announceTradeEvents = (rows: Row[], who: string) => {
  const all = rows
    .map((r) => ({
      id: Number(r?.id),
      type: r?.notification_type,
      at: r?.created_at ? new Date(r.created_at).getTime() : NaN,
    }))
    .filter((r) => Number.isFinite(r.id));
  const highest = all.reduce((m, r) => Math.max(m, r.id), 0);

  let fresh: typeof all;
  if (!heard || heard.who !== who) {
    const firstOfPageLoad = !heard;
    heard = { who, id: highest };
    /* A different account signing in: everything in its list is old news. */
    if (!firstOfPageLoad) return;
    fresh = all.filter((r) => Number.isFinite(r.at) && r.at > PAGE_OPENED_AT);
  } else {
    const since = heard.id;
    heard.id = Math.max(since, highest);
    fresh = all.filter((r) => r.id > since);
  }

  const kinds: TradeSound[] = [];
  fresh
    .sort((a, b) => a.id - b.id)
    .forEach((r) => {
      const kind = SOUND_FOR_TYPE[normaliseType(r.type)];
      if (kind && !kinds.includes(kind)) kinds.push(kind);
    });
  if (kinds.length) enqueue(kinds);
};
