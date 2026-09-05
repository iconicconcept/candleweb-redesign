import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cw-dash-theme";
export type DashboardTheme = "light" | "dark";

const readAttr = (): DashboardTheme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
    ? "light"
    : "dark";

/**
 * Light/dark toggle for the dashboard-focus shell. The theme is stored on
 * <html data-theme> (applied pre-paint by the inline script in _document) and
 * persisted to localStorage. Only `.fx-root` descendants have light styles, so
 * the rest of the app is unaffected.
 */
export default function useDashboardTheme() {
  const [theme, setThemeState] = useState<DashboardTheme>("dark");

  useEffect(() => {
    setThemeState(readAttr());
  }, []);

  const setTheme = useCallback((next: DashboardTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / storage disabled — the attribute still applies for this session */
    }
    document.documentElement.dataset.theme = next;
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(readAttr() === "light" ? "dark" : "light");
  }, [setTheme]);

  return { theme, toggle, setTheme };
}
