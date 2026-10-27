import { AxiosInstance } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import tradingV2Service from "../../services/tradingV2Service";
import { PositionV2, PositionsV2Query } from "../../types/tradingV2";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import usePoll, { POLL } from "./usePoll";
import useRevalidate from "./useRevalidate";

/**
 * Open positions from `GET /trading_v2/positions/?status=open`.
 *
 * One request per page that needs them. The rollups every caller wants —
 * total open PnL, "if every stop hit at once", the closest stop — are derived
 * from these rows in `lib/positionsV2.ts` rather than fetched separately, so
 * no two places on a page can disagree about what the same response said.
 *
 * It keeps itself fresh, so no caller has to. Two things move these rows: the
 * mark price and the trail, which drift continuously and are polled for, and
 * a fill or a close, which arrive as notifications and refetch at once. The
 * poll rate follows what is actually open — 15s while there is a position
 * moving, a quiet 60s when there is nothing to move.
 */

/** The endpoint's documented maximum. */
export const POSITION_PAGE_MAX = 100;

export type OpenPositions = {
  rows: PositionV2[];
  /** The TOTAL the endpoint reports, which may exceed what was fetched. */
  count: number;
  /** Which book these came from — the response says, so the page can too. */
  book: string | null;
  asOf: string | null;
  asked: boolean;
  failed: string | null;
  reload: () => void;
};

export const useOpenPositions = (
  api: AxiosInstance,
  query: PositionsV2Query = {},
): OpenPositions => {
  const [rows, setRows] = useState<PositionV2[]>([]);
  const [count, setCount] = useState(0);
  const [book, setBook] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const askedRef = useRef<string>("");
  /* A fill, a close, or anything else that puts money on or off the venue. */
  const stale = useRevalidate("positions");

  /* Serialised so a caller can pass an object literal without re-fetching on
     every render — the VALUES are the identity, not the object. */
  const key = JSON.stringify({
    status: query.status ?? "open",
    trade: query.trade ?? null,
    venue: query.venue ?? null,
    book: query.book ?? null,
    limit: query.limit ?? POSITION_PAGE_MAX,
    nonce,
    stale,
  });

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(api)) return;
    if (askedRef.current === key) return;
    askedRef.current = key;

    let live = true;
    let landed = false;
    const parsed = JSON.parse(key) as Record<string, unknown>;
    tradingV2Service
      .listPositions(api, {
        status: (parsed.status as "open" | "closed") ?? "open",
        trade: (parsed.trade as number) ?? undefined,
        venue: (parsed.venue as string) ?? undefined,
        book: (parsed.book as "demo" | "live") ?? undefined,
        limit: (parsed.limit as number) ?? POSITION_PAGE_MAX,
      })
      .then((page) => {
        if (!live) return;
        landed = true;
        setRows(page.results);
        setCount(page.count);
        setBook(page.book ?? null);
        setAsOf(page.as_of ?? null);
        setFailed(null);
        setAsked(true);
      })
      .catch((err: any) => {
        if (!live) return;
        landed = true;
        setRows([]);
        setCount(0);
        setFailed(err?.message || "Couldn't load positions.");
        setAsked(true);
      });

    return () => {
      live = false;
      /* Released when the reply was thrown away, or the next run skips the
         request as "already asked" and the card reads as loading for good.
         StrictMode's mount/unmount/mount makes that the common case. */
      if (!landed && askedRef.current === key) askedRef.current = "";
    };
  }, [api, key]);

  /* Faster while something is open: a position's mark and its trail move
     every minute, and the stop track is drawn from both. With nothing open
     there is nothing to redraw, so the rate drops rather than asking the
     same empty question four times a minute. A failed read keeps the slow
     rate too — retrying a broken endpoint every 15s helps nobody. */
  usePoll(reload, rows.length > 0 && !failed ? POLL.positionsOpen : POLL.positionsIdle, asked);

  return { rows, count, book, asOf, asked, failed, reload };
};

export default useOpenPositions;
