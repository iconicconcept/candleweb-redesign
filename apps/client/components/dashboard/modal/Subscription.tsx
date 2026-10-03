import Image from "next/image"
import Link from "next/link"
import { AiOutlineCheck } from "react-icons/ai"
import { BNB, Button, ETH, EthereumIcon, Heading, Modal, SOL, Typography, addExpirationDate, dollarFormat, formatDate } from "ui"
/* This used to import its shape from the old /pricing page. That page is now
   the redesigned public one and no longer exports it, so the type lives here.
   NOTE: nothing imports this modal any more -- the old pricing page was its
   only caller. Safe to delete once you are sure it is not wanted. */
export interface IPricingProps {
  icon?: any;
  title: string;
  description?: string;
  price: number;
  options?: string[];
  color?: string;
  id: number;
  unit?: number;
}
import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "../../../redux/store"
import { error } from "../../alert/Toast"


type Props = {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    subscription?: IPricingProps;
    continueFunction?: (id: number, network: number) => void;
    units: number;
}

const SubscriptionModal = ({ isOpen, setIsOpen, subscription, continueFunction, units }: Props) => {
    const { paymentIds } = useSelector((state: RootState) => state.subscription);
    const [selectedNetwork, setSelectedNetwork] = React.useState(paymentIds[0]?.id ?? 0);
    return (
        <Modal title={"Subscription payment confirmation"} isOpen={isOpen} onChnage={setIsOpen}>
            <div className="mt-7">
                {/* Plan Title */}
                <Heading textsize="md" classstyle="text_gradient inter !font-medium">{subscription?.title} Plan</Heading>
                <div className="h-5"></div>
                {/* Plan list */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <AiOutlineCheck className="text-primary" /> <Typography classstyle="!text-sm inter !font-thin">Automate trading on your chosen coin and exchange.</Typography>
                    </div>
                    <div className="h-2"></div>
                    <div className="flex items-center gap-3">
                        <AiOutlineCheck className="text-primary" /> <Typography classstyle="!text-sm inter !font-thin">Leverage auto profit, stop loss adjuster, and instant support for optimal trading.</Typography>
                    </div>
                    <div className="h-2"></div>
                    <div className="flex items-center gap-3 my-1">
                        <AiOutlineCheck className="text-primary" /> <Typography classstyle="!text-sm inter !font-thin">Efficiently manage your portfolio with the portfolio manager tool.</Typography>
                    </div>
                </div>
                <div className="h-6"></div>
                {/* Payment Details Heading */}
                <Heading textsize="md" classstyle="!text-[#A9A9A9] !font-normal sm:text-lg">Unit purchase summary</Heading>
                <div className="h-5"></div>
                {/* Payment Info */}
                <div className="">
                    <div className="flex items-center mb-1">
                        <Typography textsize="md" classstyle="w-[250px] sm:w-max sm:mr-3 sm:!text-[#A9A9A9] !font-thin inter !text-sm">Number of units:</Typography>
                        <Typography textsize="md" classstyle="!font-thin inter !text-sm">{units}</Typography>

                    </div>
                    <div className="flex items-center mt-2">
                        <Typography textsize="md" classstyle="w-[250px] sm:w-max sm:mr-3 sm:!text-[#A9A9A9] !font-thin inter !text-sm">Amount for units:</Typography>
                        <Typography textsize="md" classstyle="!font-thin inter !text-sm">{dollarFormat(((subscription?.price ?? 0) * units) ?? 0)}</Typography>

                    </div>
                </div>
                <div className="h-10"></div>
                {/* Selection options */}
                <Heading textsize="md" classstyle="!text-[#A9A9A9] !font-normal sm:text-lg">Choose network to complete payment on</Heading>
                <div className="h-5"></div>
                {/* Select Options */}

                <div className="">
                    {paymentIds.filter((id) => id.is_active === true).map((id, index) => (
                        <div className="glass__bg !rounded-lg flex items-center justify-between gap-4 p-4 cursor-pointer mb-4" onClick={() => {
                            setSelectedNetwork(id.id!)
                        }} key={id.id}>
                            <div className="flex items-center">
                                <Image src={id?.name?.toLowerCase().includes("bnb") ? BNB : id?.name?.toLowerCase().includes("solana") ? SOL : ETH} alt="Ethereum Icon" width={35} height={40} />
                                <div className="w-8"></div>
                                <div className="">
                                    <Heading textsize="sm" classstyle=" !font-normal inter sm:text-sm">{id.name}</Heading>
                                    <Typography textsize="xs" classstyle="inter !font-thin sm:!text-xs sm:text-[#c3c3c3]">{id.id === 1 ? "Secure, decentralized, and widely recognized for reliable payments." : id.id === 2 ? "Fast, efficient, and cost-effective with lower transaction fees." : ""}</Typography>
                                </div>
                            </div>
                            <div className={"rounded-full border-2 p-1 border-[#A9A9A9]"}>
                                <div className={`w-4 h-4 sm:w-3 sm:h-3 ${selectedNetwork === id.id ? "bg-txt-yellow" : "bg-transparent"} rounded-full`}></div>
                            </div>
                        </div>
                    ))}

                </div>
                <div className="h-5"></div>
                <Button variant="gradient" classstyle="yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow sm:!w-full sm:max-w-[300px] sm:!px-0" fullwidth onClick={() => {
                    if (selectedNetwork === 0) {
                        error("Please select a network");
                        return
                    }
                    continueFunction?.(subscription?.id!, selectedNetwork);
                }}>Continue</Button>
                <div className="mt-7 w-full flex items-center justify-center">
                    <Typography textsize='xs'>By continuing, you agree to the <Link href={"/terms"} target='_blank' className='underline'>Terms of Use</Link> applicable to Candle AI and confirm you have read our <Link href={"/privacy"} target='_blank' className='underline'>privacy policy</Link></Typography>
                </div>
            </div>
        </Modal>
    )
}

export default SubscriptionModal