import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";
import useUserStore from "../../../../lib/hooks/useUserStore";

export default function Leaderboard() {
  const { leaderboards } = useSelector((state: RootState) => state.task);
  const { user } = useUserStore();

  const sorted = [...leaderboards].sort(
    (a, b) => parseFloat(b.point ?? "0") - parseFloat(a.point ?? "0"),
  );
  const myIndex = sorted.findIndex((entry) => entry.account_id === user?.username);

  if (leaderboards.length === 0) {
    return <p className="fx-nempty">Loading leaderboard…</p>;
  }

  return (
    <div>
      {sorted.slice(0, 10).map((entry, idx) => (
        <div
          key={entry.account_id ?? idx}
          className={`fx-lbrow ${idx === myIndex ? "me2" : ""}`}
        >
          <span className="fx-rk2">{idx + 1}</span>
          <span className={`fx-av3 ${idx === 0 ? "g2" : ""}`}>
            {(entry.account_id || "??").slice(0, 2).toUpperCase()}
          </span>
          <div className="fx-nm3">
            <b>{entry.account_id || `Rank #${idx + 1}`}</b>
            <span>{entry.level ?? ""}</span>
          </div>
          <span className="fx-pts">{Math.floor(parseFloat(entry.point ?? "0"))} pts</span>
        </div>
      ))}
      {myIndex === -1 && (
        <p className="fx-hint" style={{ marginTop: 12 }}>
          You&apos;re not on the board yet — finish a task to earn your first points.
        </p>
      )}
    </div>
  );
}
