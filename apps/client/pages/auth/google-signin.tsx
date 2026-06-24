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

type Props = {};

const GoogleSignIn = (props: Props) => {
  const router = useRouter();
  const { setUser } = useUserStore((state) => state);
  const hasFired = useRef(false);

  const getRedirectPath = (): string => {
    // LAYER 1: Read from the callback URL query params.
    // Your backend should decode the `state` param and return `redirect` here.
    // This works even when storage is wiped (private mode, iOS Safari, etc.)
    const redirectFromUrl = router.query.redirect as string;
    if (redirectFromUrl && redirectFromUrl.startsWith("/")) {
      return redirectFromUrl;
    }

    // LAYER 2: Fall back to storage (works in most normal browsers)
    const redirectFromStorage =
      localStorage.getItem("authRedirect") ||
      sessionStorage.getItem("authRedirect");
    if (redirectFromStorage && redirectFromStorage.startsWith("/")) {
      return redirectFromStorage;
    }

    // LAYER 3: Safe default
    return "/dashboard";
  };

  const dispatchLogin = async () => {
    if (hasFired.current) return;
    hasFired.current = true;

    // Resolve redirect BEFORE the async call so all branches use the same value
    const redirect = getRedirectPath();

    try {
      const queryString = new URLSearchParams(
        router.query as Record<string, string>,
      ).toString();

      const { data } = await axiosApi.get(
        `/user/google/callback/?` + queryString,
        { withCredentials: true },
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

        // Clean up storage regardless of which layer provided the redirect
        try {
          localStorage.removeItem("authRedirect");
          sessionStorage.removeItem("authRedirect");
        } catch (e) {}

        router.push(redirect);
      } else {
        router.push(redirect);
      }
    } catch (error) {
      console.error(error);
      router.push(redirect);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.code || router.query.state) {
      dispatchLogin();
    } else {
      // No OAuth params — direct navigation to this page, send them somewhere safe
      const redirect = getRedirectPath();
      router.push(redirect);
    }
  }, [router.isReady]);

  return <Loader />;
};

export default GoogleSignIn;
