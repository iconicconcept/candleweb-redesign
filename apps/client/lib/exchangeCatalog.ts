import type { ExchangeProp } from "../types/exchange";

/* The four exchanges the designs offer (Exchanges empty state + Connect an
   exchange), in the designs' order. Each is matched to a row of
   GET /exchange/list/ by name, and that row's id is what gets saved.
   /exchange/list/ also returns test rows ("<magicmock ...>") and is missing
   BitMart, so it can't drive the cards directly — see BACKEND_API_REQUESTS
   "Bugs / cross-cutting". */
export type DesignExchange = {
  key: string;
  name: string;
  tag: string;
  broker: boolean;
  logo: string;
  fit: "contain" | "cover";
  menu: string;
  ticks: string;
  note: string;
};

const BROKER_NOTE = (n: string) =>
  `${n} is a broker partner, so fills come back faster and we can show you fees exactly as charged.`;
const PUBLIC_NOTE = (n: string) =>
  `${n} is supported through its public API. Everything works the same; fee reporting is a little less precise than with a broker partner.`;

export const DESIGN_EXCHANGES: DesignExchange[] = [
  {
    key: "kucoin",
    name: "KuCoin",
    tag: "Broker partner",
    broker: true,
    logo: "/kucoin-logo.png",
    fit: "contain",
    menu: "API Management",
    ticks: "General and Spot Trading",
    note: BROKER_NOTE("KuCoin"),
  },
  {
    key: "bitmart",
    name: "BitMart",
    tag: "Broker partner",
    broker: true,
    logo: "/bitmart-logo.png",
    fit: "contain",
    menu: "API Keys",
    ticks: "Read and Trade",
    note: BROKER_NOTE("BitMart"),
  },
  {
    key: "binance",
    name: "Binance",
    tag: "Supported",
    broker: false,
    logo: "/binance-logo.png",
    fit: "contain",
    menu: "API Management",
    ticks: "Reading and Spot Trading",
    note: PUBLIC_NOTE("Binance"),
  },
  {
    key: "bybit",
    name: "Bybit",
    tag: "Supported",
    broker: false,
    /* trimmed from the padded-square bybit-logo.jpg so it sits like the others */
    logo: "/bybit-logo-wide.png",
    fit: "contain",
    menu: "API Management",
    ticks: "Read-Write with Spot Trading",
    note: PUBLIC_NOTE("Bybit"),
  },
];

/* Exchange keys must allow these three Candleweb addresses. */
export const CONFIG_IPS = ["65.21.47.124", "107.155.122.236", "209.182.234.182"];

/* Only KuCoin keys are sent with a passphrase today (same rule the old
   add-exchange dialog used). */
export const needsPassphrase = (key: string) => key === "kucoin";

/* backend row for a design exchange, by name */
export const backendFor = (exchanges: ExchangeProp[], key: string) =>
  exchanges.find((x) => x.name?.trim().toLowerCase() === key) ?? null;
