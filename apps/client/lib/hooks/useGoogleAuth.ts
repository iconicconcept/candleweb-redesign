// import { useRouter } from "next/router";
// import { uri } from "../axiosApi";

// const useGoogleAuth = () => {
//     const router = useRouter();

//     const googleAuth = (customRedirect?: string) => {
//         // Save redirect path for the Google auth callback to use after sign-in
//         // Use the customRedirect if provided, otherwise use current router path
//         const redirect = customRedirect || router.asPath;

//         if (redirect) {
//             // Write to both storages — some browsers clear localStorage during
//             // external OAuth redirect cycles (especially in private/incognito mode)
//             localStorage.setItem('authRedirect', redirect);
//             sessionStorage.setItem('authRedirect', redirect);
//         }

//         // Redirect to Google login endpoint
//         window.location.href = `${uri}user/google/login/`;
//     };

//     return { googleAuth };
// };

// export default useGoogleAuth;

import { useRouter } from "next/router";
import { uri } from "../axiosApi";

const REDIRECT_KEY = "authRedirect";
const COOKIE_MAX_AGE = 300;

const useGoogleAuth = () => {
  const router = useRouter();

  const googleAuth = (customRedirect?: string) => {
    const redirect = customRedirect || router.asPath;

    if (redirect) {
      // Keep all three storage layers as backup
      document.cookie = `${REDIRECT_KEY}=${encodeURIComponent(redirect)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      try {
        localStorage.setItem(REDIRECT_KEY, redirect);
        sessionStorage.setItem(REDIRECT_KEY, redirect);
      } catch (e) {}
    }

    // Pass redirect directly to backend as query param
    window.location.href = `${uri}user/google/login/?redirect=${encodeURIComponent(redirect)}`;
  };

  return { googleAuth };
};

export default useGoogleAuth;
