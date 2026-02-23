import { useRouter } from 'next/router';
import React, { useEffect } from 'react'
import Loader from '../../components/Loader';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import authService from '../../services/authService';
import { axiosApi } from '../../lib/axiosApi';
import useUserStore from '../../lib/hooks/useUserStore';

type Props = {}

const GoogleSignIn = (props: Props) => {
    const router = useRouter();

    const { user, setUser } = useUserStore((state) => state);

    const dispatchLogin = async () => {
        try {
            const queryString = new URLSearchParams(router.query as Record<string, string>).toString();
            const { data } = await axiosApi.get(`/user/google/callback/?` + queryString, { withCredentials: true });
            if (data.status === "success") {

                const { data: userData } = await axiosApi.get("/user/profile/", {
                    headers: {
                        Authorization: `Bearer ${data.access_token}`
                    },
                    withCredentials: true
                })

                setUser({
                    ...userData,
                    access_token: data.access_token
                });

                const redirect = localStorage.getItem('authRedirect');
                if (redirect) {
                    localStorage.removeItem('authRedirect');
                    router.push(redirect);
                } else {
                    router.push("/dashboard")
                }

            }
        } catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {

        if (router.query) {
            // console.log(router.query)
            dispatchLogin();
        }

    }, [router.query]);

    return (

        <Loader />


    )
}

export default GoogleSignIn