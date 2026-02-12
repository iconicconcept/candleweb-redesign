import React from 'react'
import { Typography } from 'ui'

type Props = {
    text: string;
    backgroundColor?: string;
    active?: boolean,
    slug?: string;
    onclick?: (slug: string) => void
}

export const CategoriesPill = ({ text, backgroundColor }: Props) => {
    return (
        <div className='px-2 py-1 bg-white rounded-full' style={{
            background: backgroundColor ? backgroundColor : '#ffffff'
        }}>
            <Typography classstyle='!text-black !text-xs font-medium inter'>{text}</Typography>
        </div>
    )
}

export const TabPill = ({ text, active, onclick, slug }: Props) => {
    return (
        <div className={`category__pill ${active ? "active__category--pill" : "inactive__category--pill"} rounded-full`} onClick={() => { onclick!(slug!) }}>
            <Typography classstyle='!text-sm font-medium inter'>{text}</Typography>
        </div>
    )
}