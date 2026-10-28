import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cachedCatalogue,
  indicatorIndex,
  loadIndicatorCatalogue,
} from "../tradingV2Indicators";
import type { IndicatorCatalogueV2, IndicatorV2 } from "../../types/tradingV2";

export type IndicatorCatalogue = {
  catalogue: IndicatorCatalogueV2 | null;
  /** Name → entry, for turning a trade's stored names into labels. */
  index: Map<string, IndicatorV2>;
  loading: boolean;
  failed: string | null;
  reload: () => void;
};

/**
 * The indicator catalogue, shared across every screen that wants it.
 *
 * The request itself is cached in `lib/tradingV2Indicators.ts` for the life
 * of the tab, so mounting this on the trades list, a trade's detail and the
 * form costs one request between them rather than one each.
 *
 * It starts from whatever is already cached, so a second screen renders its
 * labels on the first paint instead of flashing raw `mom_rsi_14` names while
 * a request it does not need completes.
 */
export const useIndicatorCatalogue = (): IndicatorCatalogue => {
  const [catalogue, setCatalogue] = useState<IndicatorCatalogueV2 | null>(cachedCatalogue);
  const [loading, setLoading] = useState(!cachedCatalogue());
  const [failed, setFailed] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    const have = cachedCatalogue();
    if (have && nonce === 0) {
      setCatalogue(have);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(null);
    loadIndicatorCatalogue()
      .then((cat) => {
        if (!live) return;
        setCatalogue(cat);
        setFailed(cat.indicators.length ? null : "Indicators couldn't be loaded");
      })
      .catch(() => {
        if (!live) return;
        setFailed("Indicators couldn't be loaded");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [nonce]);

  const index = useMemo(() => indicatorIndex(catalogue), [catalogue]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { catalogue, index, loading, failed, reload };
};

export default useIndicatorCatalogue;
