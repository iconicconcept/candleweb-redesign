import Image from 'next/image'
import React from 'react'
import { Heading, Typography } from 'ui'

type Props = {
    icon: any;
    title: string;
    desc: string;
    fromPricing?: boolean;
}

const InfoCard = ({ icon, title, desc, fromPricing }: Props) => {
    return (
        <div className='flex rounded-full items-center border border-primary px-8 py-6 gap-5 w-full max-w-[544px] tb:max-w-none sm:px-4 sm:py-3 bg-[#1a1a1c]'>
            <div className="w-[72px] h-[72px] min-w-[72px] sm:min-w-[40px] sm:min-h-[40px] sm:w-10 sm:h-10 flex items-center justify-center bg-black rounded-full">
                <Image src={icon} alt='Info 1 Image' className='h-10 w-10 sm:w-5 sm:h-5' />
            </div>
            <div className="">
                <Heading textsize='sm' classstyle='inter mb-1 font-medium sm:text-sm'>{title}</Heading>
                <Typography classstyle='inter text-xs font-light sm:text-xs'>
                    {desc}
                </Typography>
            </div>
        </div>
    )
}

export default InfoCard