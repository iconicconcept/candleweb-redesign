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

const useGoogleAuth = () => {
    const router = useRouter();

    const googleAuth = (customRedirect?: string) => {
        const redirect = customRedirect || router.asPath;

        // Keep storage as a backup layer (for browsers that support it)
        if (redirect) {
            try {
                localStorage.setItem('authRedirect', redirect);
                sessionStorage.setItem('authRedirect', redirect);
            } catch (e) {
                // Storage blocked (e.g. private mode) — that's fine, we have the URL param (from backend)
            }
        }

        // PRIMARY METHOD: Pass redirect as a URL param to your backend.
        // Your backend must encode this into the OAuth `state` parameter sent to Google.
        // Google returns `state` untouched in the callback URL, so it survives the redirect.
        const params = new URLSearchParams();
        if (redirect) {
            params.set('redirect', redirect);
        }

        window.location.href = `${uri}user/google/login/?${params.toString()}`;
    };

    return { googleAuth };
};

export default useGoogleAuth;

