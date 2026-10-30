import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { FaFacebook } from 'react-icons/fa'
import { RiInstagramFill } from 'react-icons/ri'
import { Heading, TestimonialImage, Typography } from 'ui'

type Props = {}

const TeamCard = (props: Props) => {
    return (
        <div className="glass__bg flex flex-col items-center py-5">
            <div className="team__image grayscale sm:w-32 sm:h-32 w-[150px] h-[150px] rounded-full overflow-hidden mb-5">
                <Image
                    src={TestimonialImage}
                    // src={team.photo}
                    alt="Team Image"
                    className="w-full h-full object-cover max-w-[150px]"
                    width={30}
                    height={30}
                />
            </div>
            <Heading
                textsize="md"
                boldness="semibold"
                classstyle="inter text-txt-primary"
            >
                {/* {team.name} */}
                Bright Isaac
            </Heading>
            <Typography textsize="sm" classstyle="mt-1 mb-2 sm:text-center">
                {/* {team.position} */}
                Head of IT
            </Typography>
            <div className="team__social flex items-center gap-3">
                <Link href={"#"} target="_blank" rel="noopener noreferrer">
                    {/* <Link href={team.fb} target="_blank" rel="noopener noreferrer"> */}
                    <FaFacebook className="text-xl" />
                </Link>
                <Link href={"#"} target="_blank" rel="noopener noreferrer">
                    {/* <Link href={team.ig} target="_blank" rel="noopener noreferrer"> */}
                    <RiInstagramFill className="text-xl" />
                </Link>
            </div>
        </div>
    )
}

export default TeamCard