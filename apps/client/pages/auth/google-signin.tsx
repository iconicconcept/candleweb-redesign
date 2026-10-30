// import { useRouter } from 'next/router';
// import React, { useEffect, useRef } from 'react'
// import Loader from '../../components/Loader';
// import { axiosApi } from '../../lib/axiosApi';
// import useUserStore from '../../lib/hooks/useUserStore';

// type Props = {}

// const GoogleSignIn = (props: Props) => {
//     const router = useRouter();
//     const { setUser } = useUserStore((state) => state);
//     const hasFired = useRef(false);

//     const dispatchLogin = async () => {
//         // Prevent double-firing caused by router.query re-renders or React strict mode
//         if (hasFired.current) return;
//         hasFired.current = true;

//         // Extract redirect immediately so we can use it securely in all code branches
//         let redirect = localStorage.getItem('authRedirect') || sessionStorage.getItem('authRedirect');

//         // Ensure ONLY tutor landing page redirects are preserved as fallback, otherwise default to dashboard.
//         // This stops stale redirects from other pages causing bugs.
//         if (!redirect?.includes('/tutor')) {
//             redirect = '/dashboard';
//         }

//         try {
//             const queryString = new URLSearchParams(router.query as Record<string, string>).toString();
//             const { data } = await axiosApi.get(`/user/google/callback/?` + queryString, { withCredentials: true });

//             if (data.status === "success") {
//                 const { data: userData } = await axiosApi.get("/user/profile/", {
//                     headers: {
//                         Authorization: `Bearer ${data.access_token}`
//                     },
//                     withCredentials: true
//                 });

//                 setUser({
//                     ...userData,
//                     access_token: data.access_token
//                 });

//                 localStorage.removeItem('authRedirect');
//                 sessionStorage.removeItem('authRedirect');
//                 router.push(redirect);
//             } else {
//                  router.push(redirect);
//             }
//         } catch (error) {
//             console.log(error);
//             // On error or network failure, securely fallback to the appropriate domain!
//             router.push(redirect);
//         }
//     }

//     useEffect(() => {
//         // Wait for router to be fully hydrated with query params before firing
//         if (!router.isReady) return;

//         // Ensure we have actual OAuth params before proceeding
//         if (router.query.code || router.query.state) {
//             dispatchLogin();
//         } else {
//             // Fallback for direct navigation with no params
//             let redirect = localStorage.getItem('authRedirect') || sessionStorage.getItem('authRedirect');
//             if (!redirect?.includes('/tutor')) {
//                 redirect = '/dashboard';
//             }
//             router.push(redirect);
//         }

//     }, [router.isReady]);

//     return (
//         <Loader />
//     )
// }

// export default GoogleSignIn

import { useRouter } from "next/router";
import React, { useEffect, useRef } from "react";
import Loader from "../../components/Loader";
import { axiosApi } from "../../lib/axiosApi";
import useUserStore from "../../lib/hooks/useUserStore";
import { safeReturnTo } from "../../lib/authRedirect";

type Props = {};

const REDIRECT_KEY = 'authRedirect';

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`));
    if (!match) return null;
    try {
        return decodeURIComponent(match.split('=')[1]);
    } catch {
        return null;
    }
};

const clearRedirectStorage = () => {
    document.cookie = `${REDIRECT_KEY}=; path=/; max-age=0; SameSite=Lax`;
    try {
        localStorage.removeItem(REDIRECT_KEY);
        sessionStorage.removeItem(REDIRECT_KEY);
    } catch (e) {}
};

const getRedirectPath = (dataRedirect?: string): string => {
    // LAYER 1: From backend response (most reliable — survived the full OAuth round-trip)
    if (dataRedirect && safeReturnTo(dataRedirect)) {
        return safeReturnTo(dataRedirect);
    }

    // LAYER 2: Cookie
    const fromCookie = getCookie(REDIRECT_KEY);
    if (fromCookie && safeReturnTo(fromCookie)) {
        return safeReturnTo(fromCookie);
    }

    // LAYER 3: localStorage
    try {
        const fromLocal = localStorage.getItem(REDIRECT_KEY);
        if (fromLocal && safeReturnTo(fromLocal)) {
            return safeReturnTo(fromLocal);
        }
    } catch (e) {}

    // LAYER 4: sessionStorage
    try {
        const fromSession = sessionStorage.getItem(REDIRECT_KEY);
        if (fromSession && safeReturnTo(fromSession)) {
            return safeReturnTo(fromSession);
        }
    } catch (e) {}

    // LAYER 5: Safe default
    return '/dashboard';
};

const GoogleSignIn = (props: Props) => {
    const router = useRouter();
    const { setUser } = useUserStore((state) => state);
    const hasFired = useRef(false);

    const dispatchLogin = async () => {
        if (hasFired.current) return;
        hasFired.current = true;

        try {
            const queryString = new URLSearchParams(
                router.query as Record<string, string>
            ).toString();

            const { data } = await axiosApi.get(
                `/user/google/callback/?` + queryString,
                { withCredentials: true }
            );

            if (data.status === "success") {
                const { data: userData } = await axiosApi.get("/user/profile/", {
                    headers: {
                        Authorization: `Bearer ${data.access_token}`,
                    },
                    withCredentials: true,
                });

                setUser({
                    ...userData,
                    access_token: data.access_token,
                });

                // Pass data.redirect as Layer 1 — comes directly from backend
                const redirect = getRedirectPath(data.redirect);
                clearRedirectStorage();
                router.push(redirect);
            } else {
                const redirect = getRedirectPath();
                clearRedirectStorage();
                router.push(redirect);
            }
        } catch (error) {
            console.error(error);
            const redirect = getRedirectPath();
            clearRedirectStorage();
            router.push(redirect);
        }
    };

    useEffect(() => {
        if (!router.isReady) return;

        if (router.query.code || router.query.state) {
            dispatchLogin();
        } else {
            const redirect = getRedirectPath();
            clearRedirectStorage();
            router.push(redirect);
        }
    }, [router.isReady]);

    return <Loader />;
};

export default GoogleSignIn;
