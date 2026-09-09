import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Button, Heading, Typography, addExpirationDate, isMonthly, dollarFormat, formatDate, Modal } from "ui";
import { CloseTable } from "../../components/dashboard/table/CloseTable";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import useDashboardBootstrap from "../../lib/hooks/useDashboardBootstrap";
import { SubscriptionSkeletonLoader } from "../../components/dashboard/skeleton/SkeletonLoader";
import { SubscriptionProp } from "../../types/subscription";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import subscriptionService from "../../services/subscriptionService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
// import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import useEthereum from "../../lib/hooks/useEthereum";
import Loader from "../../components/Loader";
import { error } from "../../components/alert/Toast";
import { IPricingProps } from "../pricing";
import SubscriptionModal from "../../components/dashboard/modal/Subscription";

// Define the Props type for the component
type Props = {};

// Define the SubscriptionPage component
const SubscriptionPage = (props: Props) => {
  const minimumToken = 20;
  // Retrieve necessary data from the subscription Redux store
  const { isLoading, subscriptions, currentPlan, subscriptionHistory, paymentIds } = useSelector(
    (state: RootState) => state.subscription
  );
  const dispatch = useDispatch<AppDispatch>();
  const [unit, setUnit] = useState<{
    sub_id: number;
    unit: number
  }>({
    sub_id: 0,
    unit: minimumToken
  });

  // State variables for managing user selections
  const [modalOpen, setModalOpen] = useState<{
    open: boolean;
    plan?: IPricingProps;
  }>({
    open: false,
  });
  const [selectedSub, setSelectedSub] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    data: number;
  }>({
    open: false,
    data: 0,
  });

  // Get authentication token using custom hook
  const axiosToken = useAxiosAuth();

  useDashboardBootstrap();


  // Get Ethereum paySubscription function using custom hook
  const { paySubscription } = useEthereum()

  // Fetch subscription and history data when the component mounts
  useEffect(() => {
    dispatch(subscriptionService.getSubscriptionList());

    dispatch(subscriptionService.getSubscriptionHistoryList(axiosToken));

    if (paymentIds.length === 0) {
      dispatch(subscriptionService.getPaymentId());
    }

  }, []);

  // Function to proceed with payment and create a new subscription
  const paymentProceed = async (id: number, network: number) => {
    setLoading(true);
    if (Object.keys(currentPlan).length > 0) {
      error("You already have an active plan.")
      return
    }

    setLoading(true);
    // const sb = subscriptions[selectedSub];
    const expDate = addExpirationDate(false);


    await paySubscription((modalOpen.plan?.price!).toString(), id!, expDate, network, unit.unit);
    setModalOpen({
      open: false, plan: undefined,
    })

    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
  };


  // Find the details of the current subscription
  // const currentSubscription = subscriptions.find(sub => sub.id === currentPlan.subscription_id);

  return (
    <>
      <Head>
        <title>Subscription Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardShell active="subscription">
        <TopBar
          crumb="Dashboard / Subscription"
          title="Subscription"
          subtitle="Your plan, your remaining units, and your payment history."
        />
        {isLoading && <SubscriptionSkeletonLoader />}
        {loading && <Loader />}
        {!isLoading && <div className="sub__container px-4 sm:px-1">
          <div className="top__cards grid grid-cols-2 gap-5 sm:grid-cols-1">
            <div className="current__plan">
              <div className="current__header p-6 bg-card rounded-2xl">
                <div className="titles inter">
                  <Typography classstyle="!text-txtSec !font-medium" textsize="xs">Remaining Units</Typography>
                  <div className="mt-2">
                    <Heading textsize="lg" classstyle="!font-medium">{currentPlan.tokens ?? "--"}</Heading>
                  </div>
                </div>
              </div>
              {/* {Object.keys(currentPlan).length !== 0 && */}
              <div className="dates__title border-b-[1px] border-[var(--card-cover)] bg-card mt-5 rounded-2xl overflow-hidden">
                <div className="sub__date bg-[var(--card-cover)] px-6 py-6">
                  <Typography classstyle="!text-txtSec !font-medium" textsize="xs">Unit Category</Typography>
                  <div className="mt-2">
                    <Heading textsize="lg" classstyle="!font-medium">{currentPlan.subscription?.[0].description ?? "--"}</Heading>
                  </div>
                </div>
                <div className="sub__date grid grid-cols-2 px-6 py-6 gap-10">
                  <div className="">
                    <Heading textsize="xs" boldness="med" classstyle="">
                      {currentPlan.created_at && formatDate(currentPlan.created_at!)}
                      {!currentPlan.created_at && "--"}
                    </Heading>
                    <Typography classstyle="!text-txtSec text-[0.8rem]">
                      Last purchase
                    </Typography>
                  </div>
                  <div className="">
                    <Heading textsize="xs" boldness="med" classstyle="">
                      {Object.keys(currentPlan).length > 0 && dollarFormat(parseFloat(subscriptions!.filter((e) => e.id === currentPlan.subscription_id)[0]?.price ?? "0"))}
                      {Object.keys(currentPlan).length < 1 && "--"}
                    </Heading>
                    <Typography classstyle="!text-txtSec text-[0.8rem]">
                      Unit Price
                    </Typography>
                  </div>

                </div>
              </div>
              {/* } */}
              {/* {Object.keys(currentPlan).length == 0 && <div className="h-32 w-full flex items-center justify-center">
                <p className="text-sm text-txtSec">You don&apos;t have any active plan</p>
              </div>} */}
              {/* {Object.keys(currentPlan).length !== 0 && <div className="card__btn pl-6 py-4">
                <Button classstyle="!bg-[var(--redish)]" variant="secondary" onClick={() => {
                  setCancelModal({
                    open: true,
                    data: currentPlan.id!
                  })
                }}>
                  Cancel
                </Button>
              </div>} */}
            </div>
            <div className="change__plan rounded-2xl bg-card overflow-hidden">
              <div className="header py-3 px-6 border-b-[1px] border-[var(--card-cover)]">
                <Heading textsize="xl">Change Plan</Heading>
              </div>
              {Object.keys(subscriptions).length === 0 && <div className="h-40 w-full flex items-center justify-center">
                <p className="text-sm text-txtSec">Error fetching subscriptions, reload page</p>
              </div>}
              {Object.keys(subscriptions).length !== 0 && <div className="the__plan pt-4 px-6 border-[var(--card-cover)]">
                <div
                  className={`plan__type flex w-full items-center border border-primary justify-evenly rounded-full mb-5 mt-3 relative overflow-hidden before:z-[1] ${(selectedSub) === 0
                    ? "before:!left-[0%]"
                    : (selectedSub) === 1
                      ? "before:!left-[33.3%]"
                      : "before:!left-[66.6%]"
                    }`}
                >
                  {subscriptions.map((plan: SubscriptionProp, index: number) => (
                    <div
                      className={`plan py-2 w-full z-[5] flex justify-center`}
                      key={index + plan.name!}
                      role="button"
                      onClick={() => {
                        setSelectedSub(index)
                      }
                      }
                    >
                      <Typography
                        align="center"
                        classstyle={`font-medium inter capitalize transition duration-1000 ${(selectedSub) === index
                          ? "!text-dark"
                          : ""
                          }`}
                      >
                        {plan.name?.split(" ")[0]}
                      </Typography>
                    </div>
                  ))}
                </div>
                <div className="quota pt-5 flex items-center justify-between">
                  <div className="">
                    <Typography classstyle="!text-txtSec inter !text-xs">
                      Number of units
                    </Typography>

                    <div className="flex items-center gap-5">
                      <div className="flex gap-5 items-center justify-between m-auto w-[130px] rounded-full bg-[#595959]/45 mt-1 p-1">
                        <button className="minus min-w-8 min-h-8 max-w-8 max-h-8 rounded-full bg-black/45 flex items-center justify-center text-3xl cursor-pointer" onClick={() => {
                          if (unit.unit === minimumToken) return;
                          setUnit((prev) => ({
                            unit: subscriptions[selectedSub].id === prev.sub_id ? prev.unit - 1 : (minimumToken + 1),
                            sub_id: subscriptions[selectedSub].id!
                          }))
                        }}>
                          -
                        </button>
                        {<Typography>{unit.sub_id === subscriptions[selectedSub].id ? unit.unit : minimumToken}</Typography>}
                        <button className="plus min-w-8 min-h-8 max-w-8 max-h-8 rounded-full bg-black/45 flex items-center justify-center text-xl cursor-pointer" onClick={() => {
                          setUnit((prev) => ({
                            unit: subscriptions[selectedSub].id === prev.sub_id ? prev.unit + 1 : (minimumToken + 1),
                            sub_id: subscriptions[selectedSub].id!
                          }))
                        }}>+</button>
                      </div>
                      <Typography classstyle="!text-txtSec inter !text-sm sm:!hidden">
                        Minimum of {minimumToken} units.
                      </Typography>
                    </div>

                  </div>
                  <Typography classstyle="inter !font-semibold" textsize="xl">
                    {dollarFormat(parseFloat((parseFloat(subscriptions[selectedSub].price!) * unit.unit).toFixed(2)))}
                  </Typography>
                </div>
                <div className="h-4">

                </div>
              </div>}
              {Object.keys(subscriptions).length !== 0 && <div className="card__btn px-6 py-4">
                <Button classstyle="blue_gradient !px-0" fullwidth onClick={() => {
                  setModalOpen({
                    open: true,
                    plan: {
                      title: subscriptions[selectedSub].name!,
                      price: parseFloat(subscriptions[selectedSub].price!),
                      id: subscriptions[selectedSub].id!,
                    }
                  })
                }}>Proceed</Button>
              </div>}
            </div>
          </div>
          <div className="history mb-10 mt-7 bg-card">
            <div className="history__header py-3 px-6">
              <Heading textsize="md">History</Heading>
            </div>
            <CloseTable subscription={subscriptionHistory} subs={subscriptions} payment={() => {
              setModalOpen({
                open: true,
                plan: {
                  title: subscriptions[selectedSub].name!,
                  price: parseFloat(subscriptions[selectedSub].price!),
                  id: subscriptions[selectedSub].id!,
                }
              })
            }} />
          </div>
        </div>}
      </DashboardShell>
      <SubscriptionModal isOpen={modalOpen.open} subscription={modalOpen.plan} setIsOpen={(e) => setModalOpen((prev) => ({
        ...prev, open: e
      }))} continueFunction={(id, network) => paymentProceed(id, network)} units={unit.unit} />
      <Modal
        title={""}
        width="500px"
        isOpen={cancelModal.open}
        onChnage={(e) =>
          setCancelModal({
            data: 0,
            open: e,
          })
        }
      >
        <div className="cancelSub__modal mt-10 flex flex-col items-center text-center">
          <Heading textsize="lg" classstyle="text-center">Cancel Subscription</Heading>
          <Typography classstyle="text-center !text-txtSec !my-5">Are you sure you want to cancel this subscription?</Typography>
          <div className="mt-5 flex items-center gap-5">
            <Button variant="border" onClick={() => {
              setCancelModal({
                open: false,
                data: 0
              })
            }}>Cancel</Button>
            <Button onClick={() => {
              dispatch(subscriptionService.cancelSubscription({
                api: axiosToken,
                id: cancelModal.data
              })).then((res) => {
                setCancelModal({
                  open: false,
                  data: 0
                })
              })

            }}>Proceed</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SubscriptionPage;
