import { useCallback, useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

/** The one key. The old `cw-site-theme` is read once by the `_document`
 *  script, to carry an existing preference into the first load of this build. */
const STORAGE_KEY = "cw-theme";

/**
 * One light/dark preference for the whole product.
 *
 * The landing pages and the dashboard used to keep separate preferences, under
 * separate attributes, with opposite defaults (light vs dark) — so moving
 * between them changed the theme under you.
 *
 * Their stylesheets stay as they are: the ~171 public light rules key off
 * `[data-site-theme="light"]` and the 25 dashboard ones off
 * `[data-theme="light"] .fx-root`, and the two sets apply to disjoint parts of
 * the DOM. So rather than rewriting every selector, both attributes are
 * written together from this single value. `_document` sets both pre-paint
 * from the same key, so there is still no flash.
 */
const apply = (next: AppTheme) => {
  const el = document.documentElement;
  el.dataset.theme = next; // dashboard rules (.fx-root)
  el.dataset.siteTheme = next; // public-page rules
};

/** Light is the default; only an explicit "dark" flips it. */
const readAttr = (): AppTheme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
    ? "dark"
    : "light";

/* Two toggles can be mounted at once (a page's header and something else
   reading the value), so a change in one has to reach the others. */
const listeners = new Set<(t: AppTheme) => void>();

export default function useAppTheme() {
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    setThemeState(readAttr());
    listeners.add(setThemeState);
    return () => {
      listeners.delete(setThemeState);
    };
  }, []);

  const setTheme = useCallback((next: AppTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / storage disabled — the attributes still apply for this session */
    }
    apply(next);
    listeners.forEach((fn) => fn(next));
  }, []);

  const toggle = useCallback(() => {
    setTheme(readAttr() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, toggle, setTheme };
}

export { STORAGE_KEY };
