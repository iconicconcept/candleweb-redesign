import { AxiosInstance } from "axios";

/**
 * Checks if the "Authorization" header in the given Axios instance
 * is properly set to a non-"Bearer undefined" value.
 *
 * @param axiosInstance The Axios instance to check.
 * @returns `true` if the "Authorization" header is set correctly, otherwise `false`.
 */
export function isAuthorizationHeaderSet(
  axiosInstance: AxiosInstance
): boolean {
  const authorizationHeader = axiosInstance.defaults.headers["Authorization"];
  return (
    authorizationHeader !== "Bearer undefined" &&
    authorizationHeader !== undefined
  );
}
