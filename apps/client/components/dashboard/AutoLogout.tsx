import { useEffect, useRef } from "react";
import { setIsSuccessful } from "../../redux/slices/authSlice";
import { useDispatch } from "react-redux";
import { setExchangeRecord } from "../../redux/slices/exchangeSlice";
import { setNotification } from "../../redux/slices/notificationSlice";
import { setUserRecord, setUnsubscribedReferral, setSubscribedReferral } from "../../redux/slices/referralSlice";
import { setSubscription, setSubscriptionHistory, setCurrentPlan } from "../../redux/slices/subscriptionSlice";
import { setActiveTrade, setPortfolioTrade, setYearList, setYearAnalysis } from "../../redux/slices/tradeSlice";
import { setBalance } from "../../redux/slices/userSlice";
import { AppDispatch } from "../../redux/store";
import useUserStore from "../../lib/hooks/useUserStore";

/* "keypress" is deprecated and never fires for most keys; "visibilitychange"
   and "focus" catch coming back to the tab, and touch/wheel cover reading on a
   phone or scrolling a chart without moving the pointer. */
const events = [
    "mousemove",
    "mousedown",
    "click",
    "scroll",
    "wheel",
    "keydown",
    "touchstart",
    "focus",
];

/* Thirty minutes of genuinely no interaction. Reading a page counts as
   activity through scroll/pointer/focus, so this should only fire on a tab
   someone has walked away from. */
const IDLE_MS = 30 * 60 * 1000;


type Props = {
    children: React.ReactNode;
};



const AutoLogout: React.FC<Props> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>()
    const { removeUser } = useUserStore((state) => state);
    /* A ref, not a local `var`: that was re-created on every render, and the
       cleanup removed a different function reference than the one added, so
       every dashboard page mount piled on another set of listeners that no
       longer had a handle on the timer they were supposed to reset. */
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const logoutRef = useRef<() => void>(() => {});

    useEffect(() => {
        const clear = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
        };
        const start = () => {
            clear();
            timerRef.current = setTimeout(() => logoutRef.current(), IDLE_MS);
        };
        /* One named handler, so it can actually be removed again. */
        const onActivity = () => start();

        events.forEach((item) =>
            window.addEventListener(item, onActivity, { passive: true }),
        );
        start();

        return () => {
            events.forEach((item) => window.removeEventListener(item, onActivity));
            clear();
        };
    }, []);

    // logs out user by clearing out auth token in localStorage and redirecting url to /signin page.
    const logoutAction = () => {
        removeUser()
        dispatch(setIsSuccessful(false))
        dispatch(setSubscription([]))
        dispatch(setExchangeRecord([]))
        dispatch(setNotification({}))
        dispatch(setUserRecord({}))
        dispatch(setUnsubscribedReferral({}))
        dispatch(setSubscribedReferral({}))
        dispatch(setSubscriptionHistory([]))
        dispatch(setActiveTrade([]))
        dispatch(setPortfolioTrade({}))
        dispatch(setYearList({}))
        dispatch(setYearAnalysis([]))
        dispatch(setCurrentPlan({}))
        dispatch(setBalance(""))
        window.location.pathname = "/register";
    };
    logoutRef.current = logoutAction;

    return (<>
        {children}
    </>);
};

export default AutoLogout