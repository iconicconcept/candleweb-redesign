import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cw-site-theme";
export type SiteTheme = "light" | "dark";

/** Light is the default for the public marketing pages — only an explicit
 *  "dark" preference flips it. */
const readAttr = (): SiteTheme =>
  typeof document !== "undefined" && document.documentElement.dataset.siteTheme === "dark"
    ? "dark"
    : "light";

/**
 * Light/dark toggle for the public marketing pages (home, about, blog,
 * academy, CandleAI, docs, legal). Independent of the dashboard toggle
 * (`useDashboardTheme`): its own `<html data-site-theme>` attribute and its
 * own localStorage key, applied pre-paint by the inline script in
 * `_document`. Only `[data-site-theme="light"]` rules add light styling —
 * the shipped dark styling is untouched.
 */
export default function useSiteTheme() {
  const [theme, setThemeState] = useState<SiteTheme>("light");

  useEffect(() => {
    setThemeState(readAttr());
  }, []);

  const setTheme = useCallback((next: SiteTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / storage disabled — the attribute still applies for this session */
    }
    document.documentElement.dataset.siteTheme = next;
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(readAttr() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, toggle, setTheme };
}
