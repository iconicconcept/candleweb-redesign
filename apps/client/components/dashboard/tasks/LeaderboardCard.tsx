import React from 'react'
import Image from 'next/image'
import { Heading, Typography, UserAvatarImage } from 'ui'
import { PointBadge } from './Points'
import { LeaderboardProp } from '../../../types/task'

type Props = {
    position: number,
    leaderboard: LeaderboardProp
}

export const LeaderboardCard = ({ position, leaderboard }: Props) => {

    const colorFunction = () => {
        if (position === 1) {
            return 'bg-[#FFD700]'
        } else if (position === 2) {
            return 'bg-[#C0C0C0]'
        } else if (position === 3) {
            return 'bg-[#CD7F32]'
        } else {
            return 'bg-[#373A40]'
        }
    }

    return (
        <div className='.task__leaderboard--card w-full flex items-center gap-3 rounded-2xl overflow-hidden bg-[#282A30] pr-4'>
            <div className={`task__leaderboard-position w-12 h-full ${colorFunction()} flex items-center justify-center`}>
                <Typography textsize='md' classstyle={`inter !font-medium ${position === 1 || position === 2 || position === 3 ? '!text-black' : '!text-white'}`}>{position}</Typography>
            </div>
            <div className="task__leaderboard--userInfo flex items-center gap-2 w-full py-3">
                <Image src={UserAvatarImage} alt="Streak bike ride image" width={52} height={52} className="rounded-full w-16 h-16 tb:!w-16 tb:!h-16" />
                <div className="task__streak--Info--info flex flex-col">
                    <Heading textsize='md' boldness='med' classstyle='inter'>{leaderboard.account_id}</Heading>
                    <Typography textsize='xs' classstyle='inter' color='gray'>Level {leaderboard.level ?? 1}</Typography>

                </div>
            </div>
            <PointBadge points={parseInt(leaderboard.point ?? "0")} />

        </div>
    )
}
