import { useEffect } from "react";
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

const events = [
    "load",
    "mousemove",
    "mousedown",
    "click",
    "scroll",
    "keypress",
];


type Props = {
    children: React.ReactNode;
};



const AutoLogout: React.FC<Props> = ({ children }) => {
    var timer: any;
    const dispatch = useDispatch<AppDispatch>()
    const { removeUser } = useUserStore((state) => state);

    // this function sets the timer that logs out the user after 10 secs
    const handleLogoutTimer = () => {
        timer = setTimeout(() => {
            // clears any pending timer.
            resetTimer();
            // Listener clean up. Removes the existing event listener from the window
            Object.values(events).forEach((item) => {
                window.removeEventListener(item, resetTimer);
            });
            // logs out user
            logoutAction();
        }, 600000); // 120000 = 2 minutes
    };

    // this resets the timer if it exists.
    const resetTimer = () => {
        if (timer) clearTimeout(timer);
    };

    // when component mounts, it adds an event listeners to the window
    // each time any of the event is triggered, i.e on mouse move, click, scroll, keypress etc, the timer to logout user after 10 secs of inactivity resets.
    // However, if none of the event is triggered within 10 secs, that is app is inactive, the app automatically logs out.
    useEffect(() => {
        Object.values(events).forEach((item) => {
            window.addEventListener(item, () => {
                resetTimer();
                handleLogoutTimer();
            });
        });
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

    return (<>
        {children}
    </>);
};

export default AutoLogout