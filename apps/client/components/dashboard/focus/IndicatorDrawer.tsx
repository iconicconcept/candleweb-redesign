import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  indicatorsFor,
  pickerCategories,
  searchIndicators,
  toggleIndicatorName,
} from "../../../lib/tradingV2Indicators";
import type { IndicatorCatalogue } from "../../../lib/hooks/useIndicatorCatalogue";

/**
 * The indicator picker from the new-trade design: a drawer on the right (a
 * sheet from the bottom on a phone) with search, category pills and one row
 * per indicator, each with an ⓘ that opens its description.
 *
 * It edits the trade's selection live — there is no separate "apply" — so
 * closing it any way (Done, ×, Escape, the scrim) keeps what was ticked.
 * Selection goes through `toggleIndicatorName`, which swaps a legacy
 * `classic` name for its current one rather than sending both.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onChange: (next: string[]) => void;
  catalogue: IndicatorCatalogue;
  pairName?: string;
};

const INFO = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </svg>
);

export default function IndicatorDrawer({
  open,
  onClose,
  selected,
  onChange,
  catalogue,
  pairName,
}: Props) {
  const { catalogue: cat, index, loading, failed, reload } = catalogue;
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("popular");
  const [info, setInfo] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Fresh each time it opens, like the design: an empty search on Popular. */
  useEffect(() => {
    if (!open) return;
    setQ("");
    setInfo("");
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  /* Escape closes; Tab stays inside the drawer while it is open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !boxRef.current) return;
      const f = Array.from(
        boxRef.current.querySelectorAll<HTMLElement>("button, input, a[href]"),
      ).filter((x) => !(x as HTMLButtonElement).disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const categories = useMemo(() => pickerCategories(cat, { pairName }), [cat, pairName]);
  const query = q.trim();
  const list = useMemo(
    () => (query ? searchIndicators(cat, query, { pairName }) : indicatorsFor(cat, tab, { pairName })),
    [cat, query, tab, pairName],
  );

  if (!open) return null;

  const pills = [{ key: "popular", name: "Popular", description: "Widely used indicators from every category." }].concat(
    categories.map((c) => ({ key: c.key, name: c.name, description: c.description })),
  );
  const catDesc = pills.find((p) => p.key === tab)?.description || "";

  const host =
    typeof document !== "undefined"
      ? ((document.querySelector(".fx-root") as HTMLElement | null) ?? document.body)
      : null;

  const node = (
    <div className="nt-root">
      <div className="nt-scrim" onClick={onClose} />
      <div
        className="nt-drawer"
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nt-dr-h"
      >
        <div className="nt-poph">
          <div>
            <b id="nt-dr-h">Indicators</b>
            <small>{selected.length} selected · three to eight is plenty</small>
          </div>
          <button type="button" className="nt-x" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="nt-drtop">
          <label className="nt-sr" htmlFor="nt-ind-search">
            Search indicators
          </label>
          <div className="nt-inp">
            <input
              ref={searchRef}
              id="nt-ind-search"
              type="search"
              placeholder="Search, e.g. bollinger"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="nt-picks" role="group" aria-label="Category">
            {pills.map((c) => {
              const on = !query && tab === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`nt-pk${on ? " on7" : ""}`}
                  aria-pressed={on}
                  onClick={() => {
                    setTab(c.key);
                    setQ("");
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <p className="nt-hint" style={{ margin: 0 }}>
            {query
              ? `${list.length} match${list.length === 1 ? "" : "es"} across all categories.`
              : catDesc}
          </p>
        </div>
        <div className="nt-popb">
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {failed ? (
              <li className="nt-empty">
                Indicators couldn&rsquo;t be loaded.{" "}
                <button type="button" className="nt-a" onClick={reload}>
                  Try again
                </button>
              </li>
            ) : loading && !list.length ? (
              <li className="nt-empty">Loading indicators…</li>
            ) : list.length ? (
              list.map((i) => {
                const isOpen = info === i.name;
                const mtf = i.category === "multi_timeframe";
                const id = `nt-ind-${i.name}`;
                return (
                  <li className="nt-ind" key={i.name}>
                    <label className="nt-indrow" htmlFor={id}>
                      <input
                        type="checkbox"
                        id={id}
                        checked={selected.includes(i.name)}
                        onChange={() => onChange(toggleIndicatorName(selected, i.name, index))}
                      />
                      <span>{i.display_name}</span>
                      <small>{mtf ? "1m only" : i.values}</small>
                    </label>
                    <button
                      type="button"
                      className="nt-info"
                      aria-expanded={isOpen}
                      aria-controls={`nt-d-${i.name}`}
                      aria-label={`About ${i.display_name}`}
                      onClick={() => setInfo(isOpen ? "" : i.name)}
                    >
                      {INFO}
                    </button>
                    <p id={`nt-d-${i.name}`} hidden={!isOpen}>
                      {i.description}
                      {!mtf && i.values ? ` Values: ${i.values}.` : ""}
                    </p>
                  </li>
                );
              })
            ) : (
              <li className="nt-empty">
                {query ? `No indicator matches “${query}”.` : "Nothing in this group."}
              </li>
            )}
          </ul>
        </div>
        <div className="nt-popf">
          <span className="nt-fine">
            {cat?.indicators.length
              ? `${cat.indicators.filter((i) => i.category !== "classic").length} indicators to choose from.`
              : ""}
          </span>
          <button type="button" className="nt-mini go" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return host ? createPortal(node, host) : node;
}
