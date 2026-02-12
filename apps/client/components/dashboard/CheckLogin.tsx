import React, { useEffect, useState } from 'react';
import { useRefreshToken } from '../../lib/hooks/useRefreshToken';
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
    const hasHydration = useHydration();
    const { user, setUser } = useUserStore((state) => state);
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
            } catch (error) {
                console.error('Initialization error', error);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, [hasHydration]);

    return (
        <>
            <AutoLogout>
                {isLoading || !hasHydration ? (
                    <Loader />
                ) : user.access_token ? (
                    children
                ) : (
                    <div className="h-screen flex items-center justify-center">
                        <Typography>Redirecting...</Typography>
                    </div>
                )}
            </AutoLogout>
        </>
    );
};

export default CheckLogin;
