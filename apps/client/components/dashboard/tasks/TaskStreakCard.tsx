import React from 'react'
import Image from 'next/image'
import { Button, Checkbox, Heading, StreakImage, Typography } from 'ui'
import { RiTimerLine } from 'react-icons/ri'
import { RewardTaskProp, TaskProp } from '../../../types/task'
import { imageUri } from '../../../utils/constants'
import { FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { dismissLoader, loading, success } from '../../alert/Toast'
import { AppDispatch } from '../../../redux/store'
import { useDispatch } from 'react-redux'
import useAxiosAuth from '../../../lib/hooks/useAxiosAuth'
import taskService from '../../../services/taskService'
import { sanitizeHtml } from '../../../lib/sanitizeHtml'

type Props = {
    hasTimer?: boolean
    task?: TaskProp
    reward?: RewardTaskProp
    onVerify: () => Promise<void>
}

export const TaskStreakCard = ({ hasTimer, task, onVerify }: Props) => {
    const [state, setState] = React.useState({
        onCheck: false,
        isLoading: false,
        isExpanded: false,
    });

    const checkReward = async () => {
        try {
            setState({ ...state, isLoading: true });
            await onVerify();
        } catch (error) {
            console.log(error);
        } finally {
            setState({ ...state, isLoading: false });
        }
    }

    return (
        <div className='task__streak--card relative bg-[#0F1012] border border-[#FFB322] rounded-2xl p-4 flex gap-4 items-center justify-between pr-8 overflow-hidden'>
            <div className="task__streak--avatarInfo flex gap-5 items-center">
                <Image src={imageUri + task?.header} alt="Streak bike ride image" width={52} height={52} className="rounded-full w-20 h-20 tb:!w-16 tb:!h-16" />
                <div className="task__streak--Info--info flex flex-col sm:items-start">
                    <div className="flex items-center gap-3">
                        <Heading textsize='md' boldness='med' classstyle='inter cursor-pointer flex gap-2 items-center' onClick={() => {
                            window.open(task?.url, '_blank', 'noopener,noreferrer');
                        }}>{task?.title} <span><FiExternalLink className='text-sm' /></span> </Heading>
                        <button onClick={(e) => {
                             e.stopPropagation();
                             setState({...state, isExpanded: !state.isExpanded})
                        }} className="text-white focus:outline-none">
                             {state.isExpanded ? <FiChevronUp className="text-xl"/> : <FiChevronDown className="text-xl"/>}
                        </button>
                    </div>
                    {state.isExpanded && (
                        <div className="mt-2 flex flex-col gap-1 w-full">
                            <Typography textsize='xs' classstyle='inter sm:!text-xs cursor-pointer' onClick={() => {
                                window.open(task?.url, '_blank', 'noopener,noreferrer');
                            }} color='gray' dangerouslySetInnerHTML={{ __html: sanitizeHtml(task?.description) }}></Typography>
                            {task?.url && (
                                <a href={task.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">
                                    {task.url}
                                </a>
                            )}
                        </div>
                    )}
                    <div className="h-1"></div>
                    <div className="flex gap-3">

                        <div className="points bg-[#545860] rounded-[5px] px-1 w-max">
                            <Typography textsize='xs' classstyle='inter'>{parseInt(task?.point_reward ?? "0")} Points</Typography>
                        </div>
                        <div className="rewards_cde">
                            {task?.token_reward && <Typography textsize='xs' classstyle='inter'>Reward: <span className='text-primary'> {parseInt(task?.token_reward ?? "0")} CDE</span></Typography>}
                        </div>
                    </div>
                    <div className="h-5 w-5 sm:block sm:mt-2 hidden" onClick={() => {
                        checkReward();

                    }}>
                        {state.isLoading ? (<div className="spinner">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>) : (<Checkbox
                            value="streak"
                            labeltext=""
                            labelfor=""
                            classstyle='focus:!ring-[2px] focus:!ring-txt-yellow !ring-txt-yellow !ring-[2px]'
                            iconstyle='!text-green-500'
                            checked={state.onCheck}

                        />)}

                    </div>
                </div>
            </div>
            <div className="h-5 w-5 sm:hidden" onClick={() => {
                checkReward();

            }}>
                {state.isLoading ? (<div className="spinner">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>) : (<Checkbox
                    value="streak"
                    labeltext=""
                    labelfor=""
                    classstyle='focus:!ring-[2px] focus:!ring-txt-yellow !ring-txt-yellow !ring-[2px]'
                    iconstyle='!text-green-500'
                    checked={state.onCheck}

                />)}

            </div>
            {hasTimer && <div className="task__streak--timer absolute top-0 right-0 flex items-center gap-1 bg-red-600 rounded-bl-3xl px-3 py-1">
                <RiTimerLine className='' />
                <Heading textsize='xs' classstyle='inter sm:!text-xs'>20:30</Heading>
                <Typography textsize='xs' classstyle='inter'>Time Left</Typography>
            </div>}
        </div>
    )
}


export const TaskCompletedCard = ({ hasTimer, reward }: Props) => {

    const dispatch = useDispatch<AppDispatch>();

    const tokenApi = useAxiosAuth();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const claimReward = async () => {
        try {


            loading("Claiming Reward...");
            // Wait 700 ms 

            const check = await dispatch(taskService.claimReward({ api: tokenApi, id: reward!.task_id!.toString() })).unwrap();
            if (check.status === 'success') {

                success(check.message);
            }


        } catch (error) {
            console.log(error)
        } finally {
            dismissLoader("");
        }
    }

    return (
        <div className='task__streak--card relative bg-[#0F1012] border border-[#FFB322] rounded-2xl p-4 flex gap-4 items-center justify-between pr-8 overflow-hidden'>
            <div className="task__streak--avatarInfo flex gap-5 items-center">
                <Image src={reward?.header ?? StreakImage} alt="Streak bike ride image" width={52} height={52} className="rounded-full w-20 h-20 tb:!w-16 tb:!h-16" />
                <div className="task__streak--Info--info flex flex-col items-start">
                    <div className="flex items-center gap-3">
                        <Heading textsize='md' boldness='med' classstyle='inter' >{reward?.title}</Heading>
                        <button onClick={(e) => {
                             e.stopPropagation();
                             setIsExpanded(!isExpanded)
                        }} className="text-white focus:outline-none">
                             {isExpanded ? <FiChevronUp className="text-xl"/> : <FiChevronDown className="text-xl"/>}
                        </button>
                    </div>
                    {isExpanded && (
                        <div className="mt-2 flex flex-col gap-1 w-full">
                            <Typography textsize='xs' classstyle='inter sm:!text-xs' color='gray' dangerouslySetInnerHTML={{ __html: sanitizeHtml(reward?.description) }}></Typography>
                            {reward?.verification_link && (
                                <a href={reward.verification_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">
                                    {reward.verification_link}
                                </a>
                            )}
                        </div>
                    )}
                    <div className="h-1"></div>
                    <div className="flex gap-3">

                        <div className="points bg-[#545860] rounded-[5px] px-1 w-max">
                            <Typography textsize='xs' classstyle='inter'>{parseInt(reward?.point ?? "0")} Points</Typography>
                        </div>
                        <div className="rewards_cde">
                            {reward?.ai_unit && <Typography textsize='xs' classstyle='inter'>Reward: <span className='text-primary'> {parseInt(reward?.ai_unit)} CDE</span></Typography>}
                        </div>
                    </div>
                    <div className="sm:block sm:mt-2 hidden">
                        <Button disabled={reward?.is_reward_claimed} classstyle='!rounded-lg !py-2 !px-4 !bg-txt-yellow !border !border-txt-yellow sm:!px-2 sm:!py-1 sm:!rounded-2xl' onClick={async () => claimReward()}>
                            {reward?.is_reward_claimed ? 'Claimed!' : 'Claim Reward'}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="sm:hidden">
                <Button disabled={reward?.is_reward_claimed} classstyle='!rounded-lg !py-2 !px-4 !bg-txt-yellow !border !border-txt-yellow sm:!px-2 sm:!py-1 sm:!rounded-2xl' onClick={async () => claimReward()}>
                    {reward?.is_reward_claimed ? 'Claimed' : 'Claim Reward'}
                </Button>
            </div>
            {hasTimer && <div className="task__streak--timer absolute top-0 right-0 flex items-center gap-1 bg-red-600 rounded-bl-3xl px-3 py-1">
                <RiTimerLine className='' />
                <Heading textsize='xs' classstyle='inter sm:!text-xs'>20:30</Heading>
                <Typography textsize='xs' classstyle='inter'>Time Left</Typography>
            </div>}
        </div>
    )
}