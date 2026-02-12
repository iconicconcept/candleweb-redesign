import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { Button, Heading, Typography } from 'ui';

type TimeLeft = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

type Props = {
    targetDate: string; // The future date as a string (e.g., '2024-12-31T00:00:00')
};

const Countdown = ({ targetDate }: Props) => {

    const router = useRouter();

    const calculateTimeLeft = (): TimeLeft => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        //Clear the timer if the component is unmounted
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className='countdown mt-5'>
            <div className="glass__bg p-5 flex items-center gap-10 px-7 sm:flex-col">
                <div className="countdown_timer">
                    <Heading textsize='sm' classstyle='!text-md !font-normal'>Countdown to launch date:</Heading>
                    <div className="timers flex itmes-center gap-5 mt-2">
                        <div className="days glass__bg w-16 h-16 flex flex-col items-center !rounded-lg text-3xl p-1 font-medium">{timeLeft.days} <span className='text-sm pb-2 font-normal'>Days</span></div>
                        <div className="hours glass__bg w-16 h-16 flex flex-col items-center !rounded-lg text-3xl p-1 font-medium">{timeLeft.hours} <span className='text-sm pb-2 font-normal'>Hours</span></div>
                        <div className="minutes glass__bg w-16 h-16 flex flex-col items-center !rounded-lg text-3xl p-1 font-medium">{timeLeft.minutes} <span className='text-sm pb-2 font-normal'>Mins</span></div>
                        <div className="seconds glass__bg w-16 h-16 flex flex-col items-center !rounded-lg text-3xl p-1 font-medium">{timeLeft.seconds} <span className='text-sm pb-2 font-normal'>Secs</span></div>
                    </div>
                </div>
                <div className="register_link flex flex-col items-center">
                    <Typography classstyle='!text-sm'>A little more information</Typography>
                    <Button classstyle='!py-3' onClick={() => {
                        router.push("https://lu.ma/r7qjrskr");
                    }}>Register for Luma event</Button>
                </div>
            </div>
        </div>
    );
};

export default Countdown;
