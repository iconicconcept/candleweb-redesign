import Link from "next/link";
import { PositionV2 } from "../../../types/tradingV2";
import {
  entryToMark,
  moveClass,
  pairLabel,
  pctLabel2,
  posMoney,
  posRead,
  sizeLabel,
  stopGauge,
} from "../../../lib/positionsV2";

/**
 * The design's open-positions rows (`.fx-pos` / `.fx-row`): pair and side,
 * who opened it and its size, entry → mark, the stop-distance track, and the
 * position's own return over its money.
 *
 * Two things the row does NOT do:
 *
 *  - It does not re-derive the marker. `stop_gauge` already places price
 *    between the stop (0) and the entry (1), clamped, and the backend knows
 *    which stop actually fires first. Recomputing it from entry and stop
 *    would disagree the moment a trail moves.
 *  - It does not render a missing `at_risk` as zero. A position with no stop
 *    says so on the track instead, which is also the row worth noticing.
 *
 * `side` is always BUY — spot is long-only — so the pill is informational
 * rather than a real two-way state.
 */

const Track = ({ p }: { p: PositionV2 }) => {
  const gauge = stopGauge(p);

  if (gauge.pct == null) {
    /* No stop to gauge. This is the one row state worth making visible
       rather than drawing an empty rail that reads as "fine". */
    return (
      <div className="fx-track" title={gauge.label}>
        <span className="fx-nostop">no stop</span>
      </div>
    );
  }

  const x = Math.max(2, Math.min(98, gauge.pct));
  const colour = gauge.near ? "#FF6B85" : "#2EE6A8";
  return (
    <div className="fx-track" title={gauge.label}>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="22" x2="100" y2="22" stroke="var(--w10)" strokeWidth="1.2" />
        <line x1="0" y1="22" x2={x} y2="22" stroke={colour} strokeWidth="1.6" />
        <circle className={`mk ${gauge.near ? "risk" : ""}`} cx={x} cy="22" r="3.4" fill={colour} />
        <text x="0" y="10" fontFamily="var(--fx-mono)" fontSize="7" fill="var(--fx-t3)">
          stop
        </text>
        {/* Not always "entry": once a trail has climbed past the entry the
            track spans the stop to the price's high instead, and labelling
            that end "entry" would put the marker's destination behind it. */}
        <text
          x="100"
          y="10"
          textAnchor="end"
          fontFamily="var(--fx-mono)"
          fontSize="7"
          fill="var(--fx-t3)"
        >
          {gauge.farLabel}
        </text>
      </svg>
      {/* The one piece of good news a position can carry: if this stop fires,
          it closes at or above what it cost. */}
      {gauge.lockedIn && <span className="fx-lockedin">stop in profit</span>}
    </div>
  );
};

const PositionRow = ({ p }: { p: PositionV2 }) => {
  const pnl = posRead(p, "open_pnl");
  const pct = posRead(p, "open_return_pct");
  const who = p.bot_name || (p.decider_type === "CANDLEAI" ? "CandleAI" : "—");
  const tone = moveClass(pct.value ?? pnl.value);

  const body = (
    <>
      <div className="fx-pair">
        <b>{pairLabel(p)}</b>
        <span className={`fx-side ${p.side === "SELL" ? "s2" : "b2"}`}>
          {(p.side || "buy").toLowerCase()}
        </span>
      </div>
      <div className="fx-meta2">
        {who} · {sizeLabel(p)}
        <br />
        {entryToMark(p)}
      </div>
      <Track p={p} />
      <div className={`fx-plr ${tone}`}>
        {pct.available && pct.value != null
          ? pctLabel2(pct.value)
          : pnl.available && pnl.value != null
            ? posMoney(pnl.value, p.quote_currency)
            : "—"}
        <small>
          {pct.available && pct.value != null && pnl.available && pnl.value != null
            ? posMoney(pnl.value, p.quote_currency)
            : !pnl.available
              ? pnl.reason || "not measured"
              : "before fees"}
        </small>
      </div>
    </>
  );

  /* A position links to the trade that opened it where there is one — the
     position itself has no page of its own in this dashboard. */
  return p.trade_id != null ? (
    <Link className="fx-row" href={`/dashboard/trades/${p.trade_id}`}>
      {body}
    </Link>
  ) : (
    <div className="fx-row">{body}</div>
  );
};

type Props = {
  positions: PositionV2[];
  /** Shown instead of rows when there are none. */
  empty?: React.ReactNode;
};

const OpenPositionsList = ({ positions, empty }: Props) => {
  if (positions.length === 0) {
    return (
      <div className="fx-flat2" style={{ marginTop: 0 }}>
        {empty ?? (
          <>
            <b>Nothing open right now.</b> When a bot opens a position it appears here with its
            stop, its size and what it is doing.
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="fx-pos">
        {positions.map((p) => (
          <PositionRow key={p.position_id} p={p} />
        ))}
      </div>
      <div className="fx-stopl" style={{ marginTop: 12 }}>
        <span>
          Marker shows how far price is from the stop. Open figures are before fees, and the mark
          is the last stored candle close.
        </span>
      </div>
    </>
  );
};

export default OpenPositionsList;
