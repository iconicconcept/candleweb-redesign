/**
 * Kept as its own module so the dashboard call sites don't have to change.
 * The dashboard and the landing pages now share one preference — see
 * `useAppTheme`, which is the real implementation.
 */
import useAppTheme, { AppTheme } from "./useAppTheme";

export type DashboardTheme = AppTheme;

export default useAppTheme;
