import React from 'react'
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'


export const AmountSkeletonLoader = () => {
    return (
        <div className='grid gap-3 grid-cols-3 w-full md:auto-rows-[1fr] mt-5'>
            <div className="flex flex-col col-span-2 tb:!col-span-3 gap-3 w-full">
                <div className="left__top grid grid-cols-2 gap-4 sm:grid-cols-1">
                    <div className={`left__top--card rounded-lg flex gap-4 p-3 bg-card`}>
                        <Skeleton baseColor='#2c2f33' highlightColor='#35383d' circle height={60} width={60} />
                        <div className="w-full">
                            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={25} width={"100%"} />
                            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={30} width={"100%"} />
                        </div>
                    </div>
                    <div className={`left__top--card rounded-lg flex gap-4 p-3 bg-card`}>
                        <Skeleton baseColor='#2c2f33' highlightColor='#35383d' circle height={60} width={60} />
                        <div className="w-full">
                            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={25} width={"100%"} />
                            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={30} width={"100%"} />
                        </div>
                    </div>
                </div>
                <div className="left__bottom bg-card rounded-lg p-3">
                    <Skeleton height={300} baseColor='#2c2f33' highlightColor='#35383d' />
                </div>
            </div>
            <div className="right bg-card rounded-lg p-3">
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={"100%"} />
            </div>
        </div>
    )
}

export const DashboardSkeletonLoader = () => {
    // const bgCardClass = `bg-card rounded-lg p-3`;
    return (

        <div className="w-full rounded-lg bg-card mt-5 p-4">
            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={300} />
        </div>

    )
}

export const TableSkeletonLoader = () => {
    return (
        <div className="w-full mt-5">
            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} count={10} />
        </div>
    )
}



export const TradeSkeletonLoader = () => {
    return (
        <div>
            <div className="top__info grid grid-cols-3 tb:grid-cols-2 sm:!grid-cols-1 items-stretch gap-5">
                <div className="card1 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={250} />
                </div>
                <div className="card2 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={250} />
                </div>
                <div className="card2 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={250} />
                </div>
            </div>
            <div className="bottom__info">
                <div className="w-full mt-7">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} count={10} />
                </div>
            </div>
        </div>
    )
}


export const SubscriptionSkeletonLoader = () => {
    return (
        <div>
            <div className="top__cards grid grid-cols-2 gap-5 sm:grid-cols-1">
                <div className="card1 rounded-lg bg-card overflow-hidden">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={70} />
                    <div className="my-2"></div>
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={45} count={5} />
                </div>
                <div className="card1 rounded-lg bg-card overflow-hidden">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={70} />
                    <div className="my-2"></div>
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={45} count={5} />
                </div>
            </div>
            <div className="w-full mt-7">
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} count={10} />
            </div>

        </div>
    );
}

export const InviteSkeletonLoader = () => {
    return (
        <div>
            <div className="top__charts grid grid-cols-4 sm:!grid-cols-1 tb:grid-cols-2 items-center gap-3 bg-card p-3 rounded-lg w-full">
                <div className="card1">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={150} width={"100%"} className='rounded-lg' />
                </div>
                <div className="card2">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={150} width={"100%"} className='rounded-lg' />
                </div>
                <div className="card3">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={150} width={"100%"} className='rounded-lg' />
                </div>
                <div className="card4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={150} width={"100%"} className='rounded-lg' />
                </div>
            </div>
            <div className="h-96 max-h-96 w-full bg-card rounded-lg mt-7">
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} />
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={20} count={4} />
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={240} />
            </div>
            <div className="mt-7 grid grid-cols-2 tb:grid-cols-1 gap-6 mb-20">
                <div className="bg-card rounded-lg py-8">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={300} />
                </div>
                <div className="bg-card rounded-lg py-8">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={300} />
                </div>
            </div>
        </div>
    )
}


export const SettingSkeletonLoader = () => {
    return (
        <div>
            <div className="top__profile">
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={170} />
                <div className="mt-3"></div>
                <div className="flex gap-3 items-center">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={150} width={150} circle />
                    <div className="rema w-full ">
                        <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} width={"100%"} count={2} />
                    </div>
                </div>
                <div className="mt-3"></div>
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={170} />
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={170} />
            </div>
            <div className="w-full mt-10">
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} count={10} />
            </div>
        </div>
    )
}


export const HomeCryptoSkeletonLoader = () => {
    return (
        <div className="w-full mt-5">
            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} count={5} />
        </div>
    )
}

export const TradedAmountSkeletonLoader = () => {
    return (
        <div className="w-full mt-5 flex flex-col items-center">
            <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={80} width={80} circle />
            <div className="w-full py-3">

                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={30} />
                <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} />
            </div>
        </div>
    )
}

export const BlogSkeletonLoader = () => {
    return (
        <div>
            <div className="top__info flex flex-col gap-3 max-h-[400px]">
                <div className="card1 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={200} width={"100%"} />
                </div>
                <div className="card2 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={10} width={"100%"} />
                </div>
                <div className="card2 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={20} width={"100%"} />
                </div>
                <div className="card2 w-full bg-card rounded-lg h-full py-4">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={50} width={"100%"} />
                </div>
            </div>
            <div className="bottom__info">
                <div className="w-full mt-7">
                    <Skeleton baseColor='#2c2f33' highlightColor='#35383d' height={10} width={"100%"} count={10} />
                </div>
            </div>
        </div>
    )
}