import {
  BotV2DecisionStyle,
  BotV2OnNoReply,
  BotV2Platform,
  BotV2ReachMode,
  BotV2Status,
} from "../types/tradingV2";

/* Enum → label maps for Bots (v2). The API doc only spells out N8N_CLOUD / PUSH /
   SKIP / BUY_SELL_HOLD / ACTIVE — the rest of the keys here are the front-end's
   assumption and need confirming with the backend (tracked in
   apps/client/DASHBOARD_ENDPOINTS.md). */

export const PLATFORMS: { value: BotV2Platform; label: string; sub: string }[] = [
  { value: "N8N_CLOUD", label: "n8n Cloud", sub: "Hosted n8n workflow" },
  { value: "N8N_SELF", label: "n8n self-hosted", sub: "Your own server or machine" },
  { value: "MAKE", label: "Make", sub: "Make.com scenario" },
  { value: "ZAPIER", label: "Zapier", sub: "Zap with a webhook step" },
  { value: "OWN_CODE", label: "My own code", sub: "Python, JS, anything" },
  { value: "OTHER", label: "Something else", sub: "Tell us what" },
];

export const platformLabel = (p?: BotV2Platform): string =>
  PLATFORMS.find((x) => x.value === p)?.label || p || "—";

export const REACH_MODES: { value: BotV2ReachMode; label: string }[] = [
  { value: "PUSH", label: "Push to my bot" },
  { value: "PULL", label: "My bot will pull" },
];

export const ON_NO_REPLY: { value: BotV2OnNoReply; label: string }[] = [
  { value: "SKIP", label: "Skip the candle — do nothing" },
  { value: "HOLD", label: "Hold any open position" },
  { value: "CLOSE", label: "Close any open position" },
];

export const onNoReplyLabel = (v?: BotV2OnNoReply): string =>
  ON_NO_REPLY.find((x) => x.value === v)?.label || v || "—";

export const DECISION_STYLES: { value: BotV2DecisionStyle; label: string }[] = [
  { value: "BUY_SELL_HOLD", label: "Buy / sell / hold" },
  { value: "BUY_HOLD", label: "Buy / hold only (long)" },
  { value: "SIGNAL_STRENGTH", label: "Signal strength 0–1" },
];

export const decisionStyleLabel = (v?: BotV2DecisionStyle): string =>
  DECISION_STYLES.find((x) => x.value === v)?.label || v || "—";

export const TIMEOUT_OPTIONS = [30, 60, 120];
export const MODEL_OPTIONS = [
  "GPT-4o mini",
  "Claude Sonnet",
  "Gemini Flash",
  "Not an LLM — rules only",
];

export const STATUS_META: Record<BotV2Status, { label: string; cls: string; dead: boolean }> = {
  ACTIVE: { label: "Live", cls: "live4", dead: false },
  PAUSED: { label: "Paused", cls: "pause4", dead: false },
  FAILING: { label: "Not responding", cls: "fail4", dead: true },
};
