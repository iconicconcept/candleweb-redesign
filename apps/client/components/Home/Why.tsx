import Image from 'next/image'
import React from 'react'
import { Heading, Typography, WHY1Image } from 'ui'

type Props = {
    title: string;
    description: string;
    icon: any;
}

const WhyCard = ({ title, description, icon }: Props) => {
    return (
        <div className="why_hover relative transition duration-700 rounded-3xl">
            <div
                className="glass__bg relative z-10 transition duration-700 cursor-pointer sm:p-8 px-6 py-10 flex flex-col justify-start items-center rounded-3xl h-[320px] max-w-[360px]"
            // key={index}
            >
                <div className="card__icon flex items-center justify-center w-14 h-14 p-2 rounded-full bg-card-gradient mb-2">
                    <Image src={icon} alt="Why Icon" />
                </div>
                <Heading
                    textsize="sm"
                    classstyle="my-4 inter title__name sm:text-[1.1rem]"
                    align="center"
                >
                    {title}
                </Heading>
                <Typography
                    // textsize="sm"
                    align="center"
                    classstyle="inter text-left !text-[0.95rem]"
                >
                    {description}
                </Typography>
            </div>
        </div>
    )
}

export default WhyCard