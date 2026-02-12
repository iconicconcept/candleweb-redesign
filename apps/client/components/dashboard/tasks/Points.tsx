import React from 'react'
import { Heading, Typography } from 'ui'

type Props = {
    points: number
}

export const PointBadge = ({ points }: Props) => {
    return (
        <div className='bg-[#4F5156] rounded-md p-3 flex items-end'>
            <Heading textsize='md' color='gray'>{points}</Heading>
            <Typography textsize='xs' color='gray' classstyle='mb-1'>Points</Typography>
        </div>
    )
}
