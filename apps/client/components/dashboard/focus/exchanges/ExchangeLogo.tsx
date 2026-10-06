import { designFor } from "../../../../lib/exchangeCatalog";
import { getFirstAndLastLetter } from "../../../../utils/constants";

type Props = {
  /** The exchange's name as the backend returns it. */
  name?: string | null;
  /**
   * `row` for the compact chip on a connected-account line, `card` for the
   * wider tile on the "Add another exchange" grid — the same treatment the
   * picker on /dashboard/exchanges/new uses, since it offers the same four.
   */
  variant?: "row" | "card";
};

/**
 * An exchange's own mark, with initials as the fallback.
 *
 * Every logo we ship is a wordmark around 2.5:1, so none of them fit the square
 * initials badge these places used to draw — they get a white tile sized to the
 * artwork instead. The initials are kept for anything the catalogue has no logo
 * for, which is better than an empty box.
 */
export default function ExchangeLogo({ name, variant = "row" }: Props) {
  const design = designFor(name);
  if (!design) {
    return <span className="xl2">{getFirstAndLastLetter(String(name || "Exchange"))}</span>;
  }
  return (
    <span className={`xlogo ${variant === "card" ? "xlogo-card" : "xlogo-row"}`}>
      <img src={design.logo} alt={design.name} style={{ objectFit: design.fit }} />
    </span>
  );
}
