import Head from "next/head";
import React, { useEffect, useMemo } from "react";
import { Button, Heading, Input, Typography, dollarFormat } from "ui";

import { FiSend } from "react-icons/fi";
import Wrapper from "../../components/dashboard/wrapper";
import HalfPie from "../../components/dashboard/charts/halfPie";
import { success } from "../../components/alert/Toast";
import { InviteSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import referralService from "../../services/referralService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { SubResult } from "../../types/referral";
import useUserStore from "../../lib/hooks/useUserStore";
import Link from "next/link";

import { LuCalendarDays } from "react-icons/lu";
import { MdAttachMoney } from "react-icons/md";
import { TbUsersGroup } from "react-icons/tb";
import GapTable from "../../components/dashboard/table/GapTable";
import { inviteColumn } from "../../components/dashboard/table/HeaderColumns";
import useCopyToClipboard from "../../lib/hooks/useClipboard";
import Loader from "../../components/Loader";
import useEthereum from "../../lib/hooks/useEthereum";
import { isValidEthereumAddress } from "../../utils/ethers";
import CustomTooltip from "ui/components/tooltip/Tooltip";
import { BsQuestionCircle } from "react-icons/bs";

type Props = {};

const calcEarnings = (data: SubResult[]) => {
  if (data.length === 0) {
    return {
      totalEarnings: 0,
      lastMonthEarnings: 0
    };
  }

  const totalEarnings = data?.reduce((total, reward) => total + reward.total_earnings, 0);

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);

  const lastMonthEarnings = data?.reduce((total, reward) => {
    const createdAt = new Date(reward.created_at);
    if (
      createdAt.getFullYear() === lastMonth.getFullYear() &&
      createdAt.getMonth() === lastMonth.getMonth()
    ) {
      return total + parseFloat(reward.reward_amount ?? "0");
    }
    return total;
  }, 0);

  return {
    totalEarnings,
    lastMonthEarnings
  };
};

const InvitePage = (props: Props) => {
  const { isLoading, userReferralRecord, unsubscribedReferrals, subscribedReferrals } = useSelector(
    (state: RootState) => state.referral
  );
  const { loading } = useEthereum();
  const dispatch = useDispatch<AppDispatch>();
  const { copyToClipboard } = useCopyToClipboard();
  const axiosToken = useAxiosAuth();

  const { user } = useUserStore((state) => state);

  // const subscribes = useMemo(() => {
  //   dispatch(referralService.getUserReferral(axiosToken))
  //   dispatch(referralService.getUnsubscribedReferral(axiosToken))
  //   dispatch(referralService.getSubscribedReferral(axiosToken))
  // }, [])

  useEffect(() => {
    if (Object.keys(userReferralRecord).length === 0) {
      dispatch(referralService.getUserReferral(axiosToken));
    }

    if (Object.keys(unsubscribedReferrals).length === 0) {
      dispatch(referralService.getUnsubscribedReferral(axiosToken));
    }

    if (Object.keys(subscribedReferrals).length === 0) {
      dispatch(referralService.getSubscribedReferral(axiosToken));
    }
  }, []);
  return (
    <>
      <Head>
        <title>Invite & Earn Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Wrapper>
        {isLoading && <InviteSkeletonLoader />}
        {loading && <Loader />}
        {!isLoading && (
          <div className="invite__main px-4 sm:px-1">
            <div className="earning grid grid-cols-4 sm:!grid-cols-1 tb:grid-cols-2 items-center gap-3 bg-card px-3 pt-8 rounded-lg w-full relative">
              <div className="absolute top-2 right-2 p-2">
                <CustomTooltip text="Invite Statistics" trigger={<BsQuestionCircle />} />
              </div>
              <div className="main__earn flex flex-col items-center">
                <Heading textsize="sm" classstyle="uppercase">
                  Total Earnings
                </Heading>
                <div className="earn__chart relative">
                  <HalfPie
                    color="#1BCB80"
                    tooltip="Total Earnings"
                    amount={userReferralRecord.total_earning ?? 0}
                  />
                  <Heading
                    textsize="xs"
                    classstyle="absolute left-1/2 -translate-x-1/2 top-20"
                    boldness="med"
                  >
                    {dollarFormat(userReferralRecord.total_earning ?? 0)}
                  </Heading>
                </div>
              </div>
              <div className="main__earn flex flex-col items-center">
                <Heading textsize="sm" classstyle="uppercase">
                  Claimed Earnings
                </Heading>
                <div className="earn__chart relative">
                  <HalfPie
                    color="#FBB214"
                    tooltip="Claimed Earnings"
                    amount={userReferralRecord.claimed_earning ?? 0}
                  />
                  <Heading
                    textsize="xs"
                    classstyle="absolute left-1/2 -translate-x-1/2 top-20"
                    boldness="med"
                  >
                    {dollarFormat(userReferralRecord.claimed_earning ?? 0)}
                  </Heading>
                </div>
              </div>
              <div className="main__earn flex flex-col items-center">
                <Heading textsize="sm" classstyle="uppercase">
                  Unclaimed Earnings
                </Heading>
                <div className="earn__chart relative">
                  <HalfPie
                    color="#FD4266"
                    tooltip="Unclaimed Earnings"
                    amount={userReferralRecord.unclaimed_earning ?? 0}
                  />
                  <Heading
                    textsize="xs"
                    classstyle="absolute left-1/2 -translate-x-1/2 top-20"
                    boldness="med"
                  >
                    {dollarFormat(userReferralRecord.unclaimed_earning ?? 0)}
                  </Heading>
                </div>
              </div>
              <div className="main__earn flex flex-col items-center">
                <Heading textsize="sm" classstyle="uppercase">
                  Total Referrals
                </Heading>
                <div className="earn__chart relative">
                  <HalfPie
                    color="#379FFF"
                    tooltip="Total Referrals"
                    amount={userReferralRecord.referral_count ?? 0}
                  />
                  <Heading
                    textsize="xs"
                    classstyle="absolute left-1/2 -translate-x-1/2 top-20"
                    boldness="med"
                  >
                    {userReferralRecord.referral_count ?? 0}
                  </Heading>
                </div>
              </div>
            </div>
            <div className="invite__share flex items-center gap-10 my-5 tb:flex-col tb:gap-5">
              <div className="invite__card bg-card rounded-lg p-5 w-full">
                <div className="flex items-center gap-2">
                  <Heading textsize="sm">Invite your friends</Heading>
                  <CustomTooltip
                    text="Invite your friends & get rewards"
                    trigger={<BsQuestionCircle />}
                  />
                </div>

                <Typography textsize="xs" classstyle="!text-txtSec flex items-center">
                  Add your friends email addresses and sent them invitations to join!
                </Typography>
                <div className="input__side mt-4 flex items-center justify-between gap-2 rounded-full w-full border border-[#eeeeee] bg-[rgba(133,133,133,0.25)]  p-1">
                  <Input
                    name=""
                    type="email"
                    placeholder="Enter Email address"
                    value={""}
                    style={{
                      border: "2px solid"
                    }}
                    classstyle="!border-transparent md:min-w-[400px] focus:!outline-none !py-0 w-full"
                    onChange={(value) => {}}
                  />

                  <Button
                    variant="gradient"
                    classstyle={
                      "yellow_gradient_btn !font-bold !bg-txt-yellow !border-txt-yellow hover:!bg-txt-yellow hover:!border-txt-yellow !px-3"
                    }
                  >
                    <FiSend className="text-lg" />
                  </Button>
                </div>
              </div>
              <div className="share__card bg-card rounded-lg p-5 w-full">
                <div className="flex items-center gap-3">
                  <Heading textsize="sm">Share your referral link</Heading>
                  <CustomTooltip
                    text="Share your referral link & get rewards"
                    trigger={<BsQuestionCircle />}
                  />
                </div>

                <Typography textsize="xs" classstyle="!text-txtSec flex items-center">
                  Share your referral link by sending it to your friends or sharing it on social
                  media.
                </Typography>
                <div className="flex items-center justify-between gap-4 mt-4 sm:gap-2 w-full sm:flex-col">
                  <div className="input__side flex items-center justify-between gap-2 rounded-full w-full border border-[#eeeeee] bg-[rgba(133,133,133,0.25)] p-1 pl-3 sm:pl-2">
                    {user?.wallet_address && isValidEthereumAddress(user?.wallet_address) && (
                      <Typography
                        textsize="xs"
                        classstyle="!text-txtSec font-medium sm:!text-xs truncate"
                      >
                        https://www.candleweb.io/register?referral={user?.username}
                      </Typography>
                    )}
                    {user?.wallet_address && !isValidEthereumAddress(user?.wallet_address) && (
                      <Typography
                        textsize="xs"
                        classstyle="!text-txtSec font-medium sm:!text-xs truncate"
                      >
                        Please update your wallet address on the settings page
                      </Typography>
                    )}
                    <Button
                      variant="border"
                      classstyle={
                        " !font-bold !border-txt-yellow hover:!border-txt-yellow !px-3 !text-txt-yellow !py-2 sm:!p-1"
                      }
                      onClick={async () => {
                        if (isValidEthereumAddress(user?.wallet_address!)) {
                          const copied = await copyToClipboard(
                            `https://www.candleweb.io/register?referral=${user?.username}`
                          );
                          if (copied) {
                            success("Copied to clipboard");
                          }
                        }
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                  <div className="footer__socials flex items-center gap-2">
                    <Link
                      href="https://twitter.com/Candleweb_AI?t=3swlPh95OFEqwxeL8SX3Yg&s=09"
                      target="_blank"
                    >
                      {/* <FaXTwitter className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary" /> */}
                      <svg
                        className="flex items-center justify-center w-10 h-10 p-2 rounded-full bg-card-gradient transition duration-700 hover:text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        viewBox="0,0,256,256"
                        width="50px"
                        height="50px"
                      >
                        <g
                          fill="#ffffff"
                          fillRule="nonzero"
                          stroke="none"
                          strokeWidth="1"
                          strokeLinecap="butt"
                          strokeLinejoin="miter"
                          strokeMiterlimit="10"
                          strokeDasharray=""
                          strokeDashoffset="0"
                          fontFamily="none"
                          fontWeight="none"
                          fontSize="none"
                          textAnchor="none"
                          style={{ mixBlendMode: "normal" }}
                        >
                          <g transform="scale(5.12,5.12)">
                            <path d="M11,4c-3.866,0 -7,3.134 -7,7v28c0,3.866 3.134,7 7,7h28c3.866,0 7,-3.134 7,-7v-28c0,-3.866 -3.134,-7 -7,-7zM13.08594,13h7.9375l5.63672,8.00977l6.83984,-8.00977h2.5l-8.21094,9.61328l10.125,14.38672h-7.93555l-6.54102,-9.29297l-7.9375,9.29297h-2.5l9.30859,-10.89648zM16.91406,15l14.10742,20h3.06445l-14.10742,-20z"></path>
                          </g>
                        </g>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* DIRECT REFERRAL REWARD */}
            <div className="direct__referral--reward">
              <div className="flex items-center gap-3">
                <Heading textsize="sm">Direct Referral Rewards</Heading>
                <CustomTooltip text="Your direct referral rewards" trigger={<BsQuestionCircle />} />
              </div>

              <div className="reward__cards mt-2 flex items-center gap-5 sm:flex-col sm:w-full">
                <div className="earnings__reward flex items-center gap-4 bg-card rounded-lg w-full max-w-[290px] p-4 sm:max-w-none">
                  <div className="w-14 h-14 rounded-full border flex items-center justify-center text-primary">
                    <MdAttachMoney className="text-3xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-3">
                      <Typography textsize="sm" classstyle="!text-txtSec tb:!text-sm !truncate">
                        Your earnings
                      </Typography>
                      <CustomTooltip text="Your total earnings" trigger={<BsQuestionCircle />} />
                    </div>

                    <div className="h-1"></div>
                    <Heading textsize="lg">
                      {dollarFormat(subscribedReferrals.results?.[0]?.total_earnings ?? 0)}
                    </Heading>
                  </div>
                </div>
                <div className="monthly__reward  flex items-center gap-4 bg-card rounded-lg w-full max-w-[290px] p-4 sm:max-w-none">
                  <div className="w-14 h-14 rounded-full border flex items-center justify-center text-primary">
                    <LuCalendarDays className="text-2xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-3">
                      <Typography textsize="sm" classstyle="!text-txtSec tb:!text-sm !truncate">
                        Last Month Earnings
                      </Typography>
                      <CustomTooltip
                        text="Your total earnings last month"
                        trigger={<BsQuestionCircle />}
                      />
                    </div>
                    <div className="h-1"></div>
                    <Heading textsize="lg">
                      {dollarFormat(subscribedReferrals.results?.[0]?.last_month_earnings ?? 0)}
                    </Heading>
                  </div>
                </div>
                <div className="total__reward  flex items-center gap-4 bg-card rounded-lg w-full max-w-[290px] p-4 sm:max-w-none">
                  <div className="w-14 h-14 rounded-full border flex items-center justify-center text-primary">
                    <TbUsersGroup className="text-3xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-3">
                      <Typography textsize="sm" classstyle="!text-txtSec tb:!text-sm !truncate">
                        Total Referral
                      </Typography>
                      <CustomTooltip
                        text="Total number of referrals you have"
                        trigger={<BsQuestionCircle />}
                      />
                    </div>
                    <div className="h-1"></div>
                    <Heading textsize="lg">{subscribedReferrals?.count ?? 0}</Heading>
                  </div>
                </div>
              </div>
            </div>
            {/* DIRECT REFERRAL TABLE */}
            <div className="my-5">
              <GapTable
                rows={
                  (subscribedReferrals?.results ?? []).map((item) => {
                    return {
                      id: item.referred_id,
                      network: item.payment_id ?? "-",
                      date: item.created_at,
                      via: "Referral link",
                      status: item.is_claimed ? "Claimed" : "Unclaimed",
                      amount: item.reward_amount ?? "0",
                      action: item.is_claimed ?? true
                    };
                  }) ?? []
                }
                cols={inviteColumn}
                pagination
                isInvite
              />
            </div>
            {/* INDIRECT REFERRAL REWARD */}
            <div className="direct__referral--reward">
              <div className="flex items-center gap-3">
                <Heading textsize="sm">Indirect Referral Rewards</Heading>
                <CustomTooltip
                  text="Indirect referral rewards are the rewards you earn from your referrals' referrals"
                  trigger={<BsQuestionCircle />}
                />
              </div>

              <div className="reward__cards mt-2 flex items-center gap-5 sm:flex-col">
                <div className="earnings__reward flex items-center gap-4 bg-card rounded-lg w-full max-w-[290px] p-4 sm:max-w-none">
                  <div className="w-14 h-14 rounded-full border flex items-center justify-center text-primary">
                    <MdAttachMoney className="text-3xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <Typography textsize="sm" classstyle="!text-txtSec tb:!text-sm">
                      Your earnings
                    </Typography>
                    <div className="h-1"></div>
                    <Heading textsize="lg">
                      {dollarFormat(unsubscribedReferrals.results?.[0]?.total_earnings ?? 0)}
                    </Heading>
                  </div>
                </div>
                <div className="monthly__reward  flex items-center gap-4 bg-card rounded-lg w-full max-w-[290px] p-4 sm:max-w-none">
                  <div className="w-14 h-14 rounded-full border flex items-center justify-center text-primary">
                    <LuCalendarDays className="text-2xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <Typography textsize="sm" classstyle="!text-txtSec tb:!text-sm !truncate">
                      Last Month Earnings
                    </Typography>
                    <div className="h-1"></div>
                    <Heading textsize="lg">
                      {dollarFormat(unsubscribedReferrals.results?.[0]?.last_month_earnings ?? 0)}
                    </Heading>
                  </div>
                </div>
                <div className="total__reward  flex items-center gap-4 bg-card rounded-lg w-full max-w-[290px] p-4 sm:max-w-none">
                  <div className="w-14 h-14 rounded-full border flex items-center justify-center text-primary">
                    <TbUsersGroup className="text-3xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <Typography textsize="sm" classstyle="!text-txtSec tb:!text-sm !truncate">
                      Total Referral
                    </Typography>
                    <div className="h-1"></div>
                    <Heading textsize="lg">{unsubscribedReferrals?.count ?? 0}</Heading>
                  </div>
                </div>
              </div>
            </div>
            {/* INDIRECT REFERRAL TABLE */}
            <div className="my-5">
              <GapTable
                columnCheck
                rowCheck
                isInvite
                rows={
                  (unsubscribedReferrals?.results ?? []).map((item) => {
                    return {
                      id: item.referred_id,
                      network: item.payment_id ?? "-",
                      date: item.created_at,
                      via: "Referral link",
                      status: item.is_claimed ? "Claimed" : "Unclaimed",
                      amount: item.reward_amount ?? "0",
                      action: item.is_claimed
                    };
                  }) ?? []
                }
                cols={inviteColumn}
                isOpenModal
              />
            </div>
          </div>
        )}
      </Wrapper>
    </>
  );
};

export default InvitePage;
