import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import useAxiosAuth from "./useAxiosAuth";
import useUserStore from "./useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import tradeService from "../../services/tradeService";
import userService from "../../services/userService";
import exchangeServices from "../../services/exchangeService";

/**
 * Mount-time data fetch for the dashboard pages that still carry legacy bodies
 * (Overview, Trades, Subscription). The old `components/dashboard/wrapper.tsx`
 * + `header.tsx` chrome used to fire these; now that those pages render on
 * `DashboardShell` instead, they pull the same data through this hook so the
 * bodies keep working unchanged. Every call is guarded so it is a no-op once
 * the slice is populated. Fully redesigned focus pages don't use this — they
 * fetch exactly what they need.
 */
export default function useDashboardBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);

  const { tradePortfolio, tradePairList } = useSelector((state: RootState) => state.trade);
  const { balance } = useSelector((state: RootState) => state.user);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);

  const doneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = useUserStore.getState().user?.access_token;
    if (doneRef.current === token) return;
    doneRef.current = token || null;

    dispatch(tradeService.getTradePortfolio(axiosToken));
    dispatch(tradeService.getActiveTrade({ api: axiosToken, interval: "" }));

    if (Object.keys(tradePairList).length === 0) {
      dispatch(tradeService.getTradePairList(axiosToken));
    }
    if (!balance || balance.length === 0) {
      dispatch(userService.getBalance(axiosToken));
    }
    if (exchangeRecord.length === 0) {
      dispatch(exchangeServices.getExchangeRecords(axiosToken));
    }
    if (Object.keys(user).length < 1) {
      dispatch(userService.getUser(axiosToken));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);
}
