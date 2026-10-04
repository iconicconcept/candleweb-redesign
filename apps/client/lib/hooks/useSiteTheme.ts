/**
 * Kept as its own module so the public-page call sites don't have to change.
 * The landing pages and the dashboard now share one preference — see
 * `useAppTheme`, which is the real implementation.
 */
import useAppTheme, { AppTheme } from "./useAppTheme";

export type SiteTheme = AppTheme;

export default useAppTheme;
