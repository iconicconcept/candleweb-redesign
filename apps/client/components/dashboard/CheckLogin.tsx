import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useRefreshToken } from '../../lib/hooks/useRefreshToken';
import { signInPath } from '../../lib/authRedirect';
import Loader from '../Loader';
import useUserStore from '../../lib/hooks/useUserStore';
import { Typography } from 'ui';
import useAxiosAuth from '../../lib/hooks/useAxiosAuth';
import { useHydration } from '../../lib/hooks/useHydration';
import AutoLogout from './AutoLogout';

type Props = {
    children: React.ReactNode;
};

const CheckLogin = ({ children }: Props) => {
    const router = useRouter();
    const hasHydration = useHydration();
    const { user, setUser, removeUser } = useUserStore((state) => state);
    const refresh = useRefreshToken();
    const axiosToken = useAxiosAuth();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyRefreshToken = async () => {
            try {
                // console.log('Verifying refresh token');
                const ref = await refresh();

                if (ref?.access_token) {
                    // console.log('Has refresh token');

                    const { data: userData } = await axiosToken.get('/user/profile/', {
                        headers: {
                            Authorization: `Bearer ${ref.access_token}`,
                        },
                        withCredentials: true,
                    });

                    setUser({
                        ...userData,
                        access_token: ref.access_token,
                    });
                }
            } catch (err) {
                console.error('Error in refresh token verification', err);
            }
        };

        const initialize = async () => {
            if (!hasHydration) return; // Ensure hydration is complete before proceeding

            try {
                if (!user.access_token) {
                    await verifyRefreshToken();
                } else {
                    const { data: userData } = await axiosToken.get('/user/profile/', {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                        },
                        withCredentials: true,
                    });

                    setUser({
                        ...userData,
                        access_token: user.access_token,
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err: any) {
                /* A 401 here is the last word: the request already went through
                   the refresh interceptor, so the token could not be renewed.
                   The persisted user has to go — leaving it meant the stale
                   `access_token` from localStorage satisfied the check below
                   and rendered a dashboard whose every call then 401'd, which
                   is how someone with an expired session reached a page stuck
                   on "Loading your dashboard…". Anything else (a network drop,
                   a 500) says nothing about the session, so it is left alone. */
                if (err?.response?.status === 401) {
                    removeUser();
                }
                console.error('Initialization error', err);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, [hasHydration]);

    /* The signed-out branch below used to say "Redirecting..." and then sit
       there forever. `useRefreshToken` sends people to the login page when the
       server rejects the refresh cookie, but every other way of ending up here
       (no token at all, a refresh that never answered) had no exit. */
    useEffect(() => {
        if (isLoading || !hasHydration || user.access_token) return;
        router.replace(signInPath(router.asPath));
    }, [isLoading, hasHydration, user.access_token, router]);

    return (
        <>
            <AutoLogout>
                {isLoading || !hasHydration ? (
                    <Loader />
                ) : user.access_token ? (
                    children
                ) : (
                    <div className="h-screen flex items-center justify-center">
                        <Typography>Taking you to the login page...</Typography>
                    </div>
                )}
            </AutoLogout>
        </>
    );
};

export default CheckLogin;
