import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react'
import Loader from '../../components/Loader';
import { axiosApi } from '../../lib/axiosApi';
import useUserStore from '../../lib/hooks/useUserStore';

type Props = {}

const GoogleSignIn = (props: Props) => {
    const router = useRouter();
    const { setUser } = useUserStore((state) => state);
    const hasFired = useRef(false);

    const dispatchLogin = async () => {
        // Prevent double-firing caused by router.query re-renders or React strict mode
        if (hasFired.current) return;
        hasFired.current = true;

        try {
            const queryString = new URLSearchParams(router.query as Record<string, string>).toString();
            const { data } = await axiosApi.get(`/user/google/callback/?` + queryString, { withCredentials: true });
            if (data.status === "success") {

                const { data: userData } = await axiosApi.get("/user/profile/", {
                    headers: {
                        Authorization: `Bearer ${data.access_token}`
                    },
                    withCredentials: true
                });

                setUser({
                    ...userData,
                    access_token: data.access_token
                });

                // Try localStorage first, then sessionStorage as fallback
                // (some browsers clear localStorage during OAuth redirect cycles)
                const redirect = localStorage.getItem('authRedirect') || sessionStorage.getItem('authRedirect');
                if (redirect) {
                    localStorage.removeItem('authRedirect');
                    sessionStorage.removeItem('authRedirect');
                    router.push(redirect);
                } else {
                    // Default to dashboard if no redirect was saved
                    // Users should only be redirected to /tutor if they signed in from that page
                    router.push("/dashboard");
                }

            }
        } catch (error) {
            console.log(error);
            // On error, redirect to dashboard so user can try again
            router.push("/dashboard");
        }
    }

    useEffect(() => {
        // Wait for router to be fully hydrated with query params before firing
        if (!router.isReady) return;

        // Ensure we have actual OAuth params before proceeding
        if (router.query.code || router.query.state) {
            dispatchLogin();
        } else {
            // Fallback for direct navigation with no params
            router.push("/dashboard");
        }

    }, [router.isReady]);

    return (
        <Loader />
    )
}

export default GoogleSignIn