import Image from 'next/image'
import React from 'react'
import { Heading, Step1Icon, Typography } from 'ui'

type Props = {
    title: string;
    description: string;
    icon: any;
    index: number;
}

const NewStepCard = ({ title, description, icon, index }: Props) => {
    return (
        <div className="glass_right_bg relative tb:after:max-w-[360px]">
            <div className='h-[350px] w-full max-w-[300px] tb:max-w-[360px] glass__bg px-2 rounded-3xl flex items-center justify-center flex-col relative'>
                <div className="step_index_bg absolute top-1 right-1 w-14 h-14 rounded-full flex items-center justify-center text-3xl">{index}</div>
                <Image src={icon} alt='Step 1' className='w-20 h-20' />
                <Heading textsize='lg' classstyle='uppercase my-4' align='center'>{title}</Heading>
                <Typography textsize='sm' classstyle='inter tb:px-5' align='center'>{description}</Typography>
            </div>
        </div>
    )
}

export default NewStepCard

