import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import { setBookV2 } from "../../redux/slices/tradingV2Slice";
import { BookV2Param } from "../../types/tradingV2";
import { bookOf } from "../book";
import useUserStore from "./useUserStore";

/**
 * The book every book-scoped call on this page should ask for.
 *
 * One source — the Settings switch, as `is_live_mode` on the profile — so the
 * page's requests and the mode it claims to be showing cannot drift apart.
 * Pass it to every book-scoped call and put it in the dependency list of the
 * effect that fetches: when it changes, everything asks again.
 */
export const useBook = (): BookV2Param => {
  const isLive = useUserStore((state) => state.user?.is_live_mode);
  return bookOf(isLive);
};

/**
 * Keeps the cached trades and bots honest about which book they came from.
 *
 * Mounted once in the dashboard shell, so it covers every page at once rather
 * than leaving each to remember. The switch lives on the Settings page, but
 * the rows it invalidates sit in a Redux slice that outlives that page — so
 * "refetch on mode change" cannot be the responsibility of whichever screen
 * happened to be open when the user flipped it.
 *
 * `setBookV2` is a no-op unless the book actually changed, which is the
 * common case here: this runs on every mount.
 */
export const useBookSync = (): BookV2Param => {
  const book = useBook();
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(setBookV2(book));
  }, [book, dispatch]);
  return book;
};

export default useBook;
