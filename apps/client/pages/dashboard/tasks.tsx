import Head from 'next/head'
import React, { useEffect } from 'react'
import Wrapper from '../../components/dashboard/wrapper'
import { Button, DashTextInput, Heading, maskWalletAddress, Modal, StreakJson, Typography, UserAvatarImage } from 'ui'
import Image from 'next/image'
import { TaskCompletedCard, TaskStreakCard } from '../../components/dashboard/tasks/TaskStreakCard'
import { LeaderboardCard } from '../../components/dashboard/tasks/LeaderboardCard'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../redux/store'
import taskService from '../../services/taskService'
import useAxiosAuth from '../../lib/hooks/useAxiosAuth'
import { LeaderboardProp, RewardTaskProp, TaskProp } from '../../types/task'
import useUserStore from '../../lib/hooks/useUserStore'
// import Lottie from 'lottie-react'
import { dismissLoader, loading, success } from '../../components/alert/Toast'
import { FiLink } from 'react-icons/fi'
import Loader from 'ui/components/feedback/loader'
import dynamic from 'next/dynamic'

type Props = {}

const TaskPage = (props: Props) => {

    const { tasks, streak, stats, completed, leaderboards } = useSelector((state: RootState) => state.task);
    const { user } = useUserStore((state) => state);
    const [selectedTabIndex, setSelectedTabIndex] = React.useState(0);
    const [openVerifyModal, setOpenVerifyModal] = React.useState<{ open: boolean; data?: TaskProp }>({ open: false });
    const [verifyLink, setVerifyLink] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const dispatch = useDispatch<AppDispatch>();

    const tokenApi = useAxiosAuth();

    const LottiePlayer = dynamic(() => import('lottie-react'), {
        ssr: false,
    });


    useEffect(() => {
        const fetchAPIs = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));

            dispatch(taskService.getTasks(tokenApi));
            dispatch(taskService.getTaskStats(tokenApi));
            dispatch(taskService.getReward(tokenApi));
            dispatch(taskService.getTaskStreak(tokenApi));
            dispatch(taskService.getLeaderboard(tokenApi));
        }
        fetchAPIs();
    }, [])


    return (
        <>
            <Head>
                <title>Tasks Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Wrapper>
                <div className="task__bg">
                    <div className="task__header--title">
                        <Heading textsize='lg' boldness='med'>Daily tasks and rewards</Heading>
                    </div>
                    <div className="task__content--body bg-[#2D3036] rounded-xl mt-3">
                        <div className="task__content--header p-8 sm:p-4">
                            <div className="task__header--topDetails  flex items-center justify-between sm:flex-col sm:gap-5 sm:items-start">

                                <div className="task__header--topLeftInfo flex gap-4">

                                    <div className="task__header--avatar">
                                        <Image src={UserAvatarImage} alt="User Avatar" width={52} height={52} className="rounded-full w-20 h-20 tb:!w-16 tb:!h-16" />
                                    </div>
                                    <div className="task__header--userInfo">
                                        <Heading textsize='md' boldness='med'>{user.username}</Heading>
                                        <Typography textsize='sm' color='gray'>{maskWalletAddress(user.wallet_address ?? "")}</Typography><br />
                                        <Typography textsize='xs' classstyle='!font-medium'>Level {stats.level}</Typography>
                                    </div>
                                </div>
                                {/* <PointBadge points={parseInt(stats.point ?? "0")} /> */}
                                <div className="points flex gap-4 sm:w-full">
                                    <div className="rewards__points bg-[#4F5156] rounded-2xl py-2 px-5 sm:w-full">
                                        <Typography textsize='xs' classstyle='!font-normal'>Reward earned</Typography>
                                        <Heading textsize='xl' classstyle='inter !font-normal'>{parseInt(stats.point ?? "0")}</Heading>
                                    </div>
                                    <div className="ai_units bg-[#4F5156] rounded-2xl py-2 px-5 sm:w-full">
                                        <Typography textsize='xs' classstyle='!font-normal'>AI units earned</Typography>
                                        <Heading textsize='xl' classstyle='inter !font-normal !text-primary'>{parseInt((stats.earned_units ?? 0).toString())}</Heading>
                                    </div>

                                </div>
                            </div>
                            <div className="task__header--progressLevel mt-10">
                                <div className="task__progressLevel--title flex justify-between items-center">
                                    <Typography textsize='xs'>Level {stats.level}</Typography>
                                    <Typography textsize='xs'>Level {(stats.level)}</Typography>
                                </div>
                                <div className="task__progressLevel--progressBar mt-2">
                                    <div className="task__progressBar--outer bg-[#D9D9D9] rounded-xl w-full h-4">
                                        <div className="task__progressBar--inner bg-primary h-4 rounded-l-xl w-1/2 z-10"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="task__content--animation bg-[#4A4A4D] w-full p-3 flex flex-col gap-2 items-center justify-center">
                            {/* <Image src={StreakDayImage} alt="Streak bike ride image" width={52} height={52} className="rounded-full w-20 h-20 tb:!w-16 tb:!h-16" /> */}
                            <LottiePlayer animationData={StreakJson} width={70} height={70} loop={true} className='w-24 h-24' />
                            <div className="task__animation--text flex gap-2">
                                <Typography textsize='xl' classstyle='!font-bold'>{streak.user_streak ?? 1}</Typography>
                                <Typography textsize='xl' classstyle='text_gradient !font-bold'>Days Streak</Typography>
                            </div>
                        </div>
                        <div className="task__content--tabs my-10">
                            <div className="task__tabbar w-full flex items-center justify-center">
                                <div className="task__tabbar--outer inset-0 bg-[#2D2F36] border border-[#353840] shadow-[0px_1px_5px_#121414] rounded-full box-border w-full max-w-[320px] flex items-center gap-4 p-1">
                                    <div className={`task__tabbar--active active__tasktab ${selectedTabIndex === 0 ? 'bg-txt-yellow shadow-[0px_1px_2px_#1B1D1E] rounded-full' : ''} px-5 py-3 w-full cursor-pointer`} onClick={() => setSelectedTabIndex(0)}>
                                        <Typography textsize='md' classstyle={`inter ${selectedTabIndex === 0 ? "!text-black !font-medium" : ""} `}>Active Tasks</Typography>
                                    </div>
                                    <div className={`task__tabbar--active active__tasktab ${selectedTabIndex === 1 ? 'bg-txt-yellow shadow-[0px_1px_2px_#1B1D1E] rounded-full' : ''} px-5 py-3 w-full cursor-pointer`} onClick={() => setSelectedTabIndex(1)}>
                                        <Typography textsize='md' classstyle={`inter ${selectedTabIndex === 1 ? "!text-black !font-medium" : ""} `}>Completed</Typography>
                                    </div>
                                </div>
                            </div>
                            {selectedTabIndex == 0 && <div className="task__tabbody p-10 sm:p-4 flex flex-col gap-5">
                                {tasks.length > 0 && tasks?.map((task: TaskProp, index: number) =>
                                    <TaskStreakCard key={index} task={task} onVerify={async () => {
                                        setOpenVerifyModal({ open: true, data: task });
                                    }} />
                                )}

                                {tasks.length < 1 && <div className="h-10 flex items-center justify-center p-4" ><Heading textsize='md' boldness='med'>No active tasks</Heading></div>}

                            </div>}
                            {selectedTabIndex == 1 && <div className="task__tabbody p-10 sm:p-4 flex flex-col gap-5">
                                {completed.length > 0 && completed?.map((reward: RewardTaskProp, index: number) =>
                                    <TaskCompletedCard key={index + (reward.id ?? 1)} reward={reward} onVerify={async () => { }} />
                                )}

                                {completed.length < 1 && <div className="h-10 flex items-center justify-center p-4" ><Heading textsize='md' boldness='med'>No completed tasks</Heading></div>}

                            </div>}
                        </div>
                    </div>
                    {leaderboards && leaderboards.length < 1 && <div className="task__leaderboard mt-10">
                        <div className="task__leaderboard--header">
                            <Heading textsize='lg' boldness='med'>Leaderboard ranking</Heading>
                        </div>
                        <div className="task__leaderboard--content grid grid-cols-2 gap-5 mt-4 tb:grid-cols-1">
                            {leaderboards?.map((leaderboard: LeaderboardProp, index: number) => <LeaderboardCard leaderboard={leaderboard} position={index + 1} />)}
                        </div>
                    </div>}
                </div>
            </Wrapper>
            <Modal
                title={"Claim Task Reward"}
                width="500px"
                isOpen={openVerifyModal.open}
                onChnage={(e) =>
                    setOpenVerifyModal({
                        data: undefined,
                        open: e,
                    })
                }
            >
                <div className="cancelSub__modal flex flex-col items-start text-center">
                    {/* <Heading textsize="lg" classstyle="text-center">Claim tas</Heading> */}
                    <Typography textsize='xs' classstyle="text-center !mb-2 !font-normal">Kindly provide means of authentication.</Typography>
                    <DashTextInput
                        type="text"
                        name="verify_link"
                        className="!my-2"
                        placeholder='Paste interaction link here'
                        label='Verification link'
                        value={verifyLink}
                        dash
                        Icon={
                            <FiLink />
                        }
                        onChange={(e) => {
                            setVerifyLink(e.target.value)
                        }}
                    />
                    <div className="mt-5">
                        <Button onClick={async () => {
                            try {


                                loading("Verifying...");
                                // Wait 700 ms 


                                const check = await dispatch(taskService.verifyReward({ api: tokenApi, data: { task_id: openVerifyModal.data?.id, link: verifyLink } })).unwrap();
                                if (check.status === 'success') {
                                    dispatch(taskService.getTasks(tokenApi));
                                    dispatch(taskService.getTaskStats(tokenApi));
                                    dispatch(taskService.getReward(tokenApi));
                                    dispatch(taskService.getTaskStreak(tokenApi));

                                    success(check.message);
                                }

                                await new Promise(resolve => setTimeout(resolve, 700));

                                setOpenVerifyModal({
                                    data: undefined,
                                    open: false,
                                })

                            } catch (error) {
                                console.log(error)

                            } finally {

                                dismissLoader('');
                            }


                        }}>Proceed</Button>
                    </div>
                </div>
            </Modal>
            {isLoading && <Loader />}
        </>
    )
}

export default TaskPage