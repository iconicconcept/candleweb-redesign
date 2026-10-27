import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { RevalidateKey } from "../../redux/slices/revalidateSlice";

/**
 * A number that changes whenever this resource is marked stale.
 *
 * Put it in the dependency list of the effect that fetches, or in the key a
 * fetch guard compares against, and the view re-reads when something
 * elsewhere — a notification, a user action — says the data moved.
 *
 * It is only ever a signal. The view still builds its own request, so a
 * filtered or paged view re-reads the page it is actually showing rather
 * than being snapped back to the first one.
 */
export const useRevalidate = (key: RevalidateKey): number =>
  useSelector((state: RootState) => state.revalidate[key]);

/** Several at once, summed — the sum changes whenever any of them does.
 *  A view that reads two resources only needs one number to depend on. */
export const useRevalidateAny = (...keys: RevalidateKey[]): number =>
  useSelector((state: RootState) => keys.reduce((n, k) => n + state.revalidate[k], 0));

/**
 * Run `fn` when this resource is marked stale — but never on mount.
 *
 * The naive version of this is `useEffect(() => { if (n > 0) refetch() },
 * [n])`, and it is wrong in a way that only shows up after the app has been
 * open for a while: the counters are global and never reset, so once ANY
 * notification has bumped `metrics`, every page that mounts afterwards sees a
 * non-zero counter and immediately refetches on top of the fetch it just made
 * on mount. Every navigation would cost double the requests, and only after
 * the first event — which is exactly the kind of thing that survives testing.
 *
 * So the counter seen at mount is recorded and treated as "already handled".
 * Only a change after that is a signal, because only that is news.
 *
 * `enabled` false still records the change rather than queueing it: a view
 * that was not ready has not fetched yet, so its own first read will pick up
 * whatever the event was about.
 */
export const useRevalidateEffect = (
  keys: RevalidateKey | RevalidateKey[],
  fn: () => void,
  enabled = true,
): void => {
  const list = Array.isArray(keys) ? keys : [keys];
  const counter = useSelector((state: RootState) =>
    list.reduce((n, k) => n + state.revalidate[k], 0),
  );
  /* Read through a ref so an inline callback does not count as a change. */
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seen = useRef<number | null>(null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = counter;
      return;
    }
    if (seen.current === counter) return;
    seen.current = counter;
    if (enabled) fnRef.current();
  }, [counter, enabled]);
};

export default useRevalidate;
