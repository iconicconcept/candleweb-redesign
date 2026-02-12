import React from 'react'
import AmountCard from './cards/amount'
import { BsCurrencyDollar } from 'react-icons/bs'
import { TbDatabase } from 'react-icons/tb'
import Stats from './charts/bar'
import { Heading } from 'ui'
import Radial from './charts/radial'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { AmountSkeletonLoader } from './skeleton/SkeletonLoader'

type Props = {}

const AmountStats = (props: Props) => {
    const { tradePortfolio, tradePortfolioLoading } = useSelector((state: RootState) => state.trade);
    return (<>
        {tradePortfolioLoading && <AmountSkeletonLoader />}

        {!tradePortfolioLoading && <div className="amount__stats grid gap-3 grid-cols-3 w-full md:auto-rows-[1fr]">
            <div className="left__details flex flex-col col-span-2 tb:!col-span-3 gap-3 w-full">
                <div className="amount__cards grid grid-cols-2 gap-4 sm:grid-cols-1">
                    <AmountCard
                        icon={<BsCurrencyDollar />}
                        title="Total Trades"
                        amount={tradePortfolio.total_trades ?? 0}
                    />
                    <AmountCard
                        icon={<TbDatabase />}
                        title="Total Orders"
                        amount={Math.ceil((tradePortfolio.total_orders ?? 0) / 2)}
                    />
                </div>
                <div className="stat__card w-full rounded-lg bg-card">
                    <Stats />
                </div>
            </div>
            <div className="right__details flex-none w-full tb:!col-span-3 rounded-lg bg-card p-4 flex flex-col items-center justify-center">
                <Heading textsize="md">Profit/Loss Margin</Heading>
                <div className="w-full h-full sm:h-[378px]">
                    <Radial profit={tradePortfolio.total_profit_margin ?? 0} loss={tradePortfolio.total_loss_margin ?? 0} />
                </div>
            </div>
        </div>}
    </>
    )
}

export default AmountStats