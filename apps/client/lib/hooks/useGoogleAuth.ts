import { useRouter } from "next/router";
import { uri } from "../axiosApi";

const useGoogleAuth = () => {
    const router = useRouter();

    const googleAuth = (customRedirect?: string) => {
        // Save redirect path for the Google auth callback to use after sign-in
        // Use the customRedirect if provided, otherwise use current router path
        const redirect = customRedirect || router.asPath;

        if (redirect) {
            // Write to both storages — some browsers clear localStorage during
            // external OAuth redirect cycles (especially in private/incognito mode)
            localStorage.setItem('authRedirect', redirect);
            sessionStorage.setItem('authRedirect', redirect);
        }

        // Redirect to Google login endpoint
        window.location.href = `${uri}user/google/login/`;
    };

    return { googleAuth };
};

export default useGoogleAuth;

