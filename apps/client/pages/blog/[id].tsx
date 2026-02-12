import React, { useMemo, useState } from 'react'
import { FiArrowUpRight } from 'react-icons/fi'
import { BLOGIMAGE, Button, Heading, Modal, Typography, formatBlogTime, formatDateTime } from 'ui'
import { CategoriesPill } from '../../components/Blog/CategoriesPill'
import Image from 'next/image'
import BlogCard from '../../components/Blog/BlogCard'
import { useMediaQuery } from '@react-hook/media-query'
import Footer from '../../components/Footer'
import { AiFillLinkedin, AiOutlineShareAlt } from 'react-icons/ai'
import { useRouter } from 'next/router'
import { BlogProp } from '../../types/blog'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../redux/store'
import useAxiosAuth from '../../lib/hooks/useAxiosAuth'
import blogService from '../../services/blogService'
import { imageUri } from '../../utils/constants'
import Head from 'next/head'
import Link from 'next/link'
import useCopyToClipboard from '../../lib/hooks/useClipboard'
import { success } from '../../components/alert/Toast'


type Props = {
    id: string;
}

const BlogDetails = (props: Props) => {
    const isMobile = useMediaQuery("only screen and (max-width: 600px)");
    const [openShareLinkModal, setOpenShareLinkModal] = useState(false);
    const router = useRouter();

    const { copyToClipboard } = useCopyToClipboard();

    const [blog, setBlog] = useState<BlogProp | null>(null);

    const dispatch = useDispatch<AppDispatch>()
    const axiosToken = useAxiosAuth();

    const blogs = useMemo(async () => {
        if (router.isReady) {
            const data = await dispatch(blogService.getBlog({
                api: axiosToken,
                id: props.id
            })).unwrap();
            setBlog(data ?? null);
            return data;
        }
    }, [router.isReady]);

    return (
        <>
            <Head>
                <title>{blog?.title}</title>
                <meta name="description" content={blog?.content.slice(0, 100)} />
                <meta name="keywords" content={blog?.tags.map((tag) => tag.name).join(",")} />
                <meta property="og:title" content="CandleWeb - AI-Powered Trading Platform for Profitable Trades" />
                <link rel="canonical" href="https://candleweb.io" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div>
                <div className="blog__main max-w-[800px] m-auto mt-32 w-full ai:!px-10 tb:!px-10 sm:!px-5">
                    <div className="blog__header flex items-center justify-between w-full gap-10">

                        <Heading textsize='lg' classstyle='!font-medium inter'>{blog?.title}</Heading>
                        <AiOutlineShareAlt className='text-txt-yellow text-2xl cursor-pointer' onClick={() => { setOpenShareLinkModal(true) }} />
                    </div>
                    <div className="h-3"></div>
                    <Typography textsize='sm' classstyle="blog__date !text-primary font-medium inter">{formatBlogTime(blog?.created_at)}</Typography>
                    <div className="h-3"></div>
                    <div className="blog__categories flex items-center gap-3">
                        {blog?.tags && blog?.tags.map((tag, index) => (
                            <CategoriesPill text={tag.name} key={index + tag.id} />
                        ))}
                    </div>
                    <div className="h-4"></div>
                    <Image src={imageUri + blog?.photo} alt='Blog Image' width={100} height={500} className='w-full h-full max-h-[500px] object-cover' />
                    <div className="h-4"></div>
                    <div className="blog__description">
                        {blog?.content && <Typography classstyle='blog_details--content' dangerouslySetInnerHTML={{ __html: blog?.content.replace(/<strong>/g, '<br /><strong>') }}>

                        </Typography>}
                    </div>
                </div>
                <div className="blog__suggestions max-w-[1065px] m-auto mt-10">
                    <div className="recent__blog--rightblogs flex gap-10 w-full tb:flex-col tb:m-auto tb:px-10">
                        {/* <BlogCard vertical={isMobile} reduceCategories fullWidth />
                    <BlogCard vertical={isMobile} reduceCategories fullWidth /> */}
                    </div>
                </div>
                <Footer />
            </div>
            <Modal
                title={"Share on social media"}
                width="500px"
                isOpen={openShareLinkModal}
                onChnage={(e) => {
                    setOpenShareLinkModal(e)
                }}
            >
                <div className="sharemodal__body mt-8">
                    <div className="share__icons--text flex items-center justify-between">
                        <Typography classstyle='Inter'>Where would you <br /> like to share it?</Typography> <div className="share__icons flex items-center gap-5">
                            <Link href={`https://twitter.com/share?url=https://candleweb.io/blog?id=${blog?.blog_slug}`} className='w-16 h-16 rounded-full bg-[#333333] flex items-center justify-center' target='_blank'>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.66699 23.3327L12.563 15.4367M15.433 12.5667L23.3337 4.66602M4.66699 4.66602L18.3555 23.3327H23.3337L9.64516 4.66602H4.66699Z" stroke="#E4F2FF" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                            </Link>
                            <Link href={`https://www.facebook.com/sharer/sharer.php?u=https://candleweb.io/blog?id=${blog?.blog_slug}`} className='w-16 h-16 rounded-full bg-[#333333] flex items-center justify-center' target='_blank'>
                                <svg width="15" height="22" viewBox="0 0 15 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.16699 8.66667V13.3333H4.66699V21.5H9.33366V13.3333H12.8337L14.0003 8.66667H9.33366V6.33333C9.33366 6.02391 9.45658 5.72717 9.67537 5.50838C9.89416 5.28958 10.1909 5.16667 10.5003 5.16667H14.0003V0.5H10.5003C8.95323 0.5 7.4695 1.11458 6.37554 2.20854C5.28157 3.30251 4.66699 4.78624 4.66699 6.33333V8.66667H1.16699Z" stroke="#E4F2FF" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                            <Link href={`https://www.linkedin.com/sharing/share-offsite/?url=https://candleweb.io/blog?id=${blog?.blog_slug}`} className='w-16 h-16 rounded-full bg-[#333333] flex items-center justify-center' target='_blank'> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.33366 8.83268V14.666M5.33366 5.33268V5.34435M10.0003 14.666V8.83268M0.666992 2.99935C0.666992 2.38051 0.912825 1.78702 1.35041 1.34943C1.78799 0.911848 2.38149 0.666016 3.00033 0.666016H17.0003C17.6192 0.666016 18.2127 0.911848 18.6502 1.34943C19.0878 1.78702 19.3337 2.38051 19.3337 2.99935V16.9994C19.3337 17.6182 19.0878 18.2117 18.6502 18.6493C18.2127 19.0869 17.6192 19.3327 17.0003 19.3327H3.00033C2.38149 19.3327 1.78799 19.0869 1.35041 18.6493C0.912825 18.2117 0.666992 17.6182 0.666992 16.9994V2.99935Z" stroke="#ECFDF8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14.6667 14.6654V11.1654C14.6667 10.5465 14.4208 9.95303 13.9832 9.51545C13.5457 9.07786 12.9522 8.83203 12.3333 8.83203C11.7145 8.83203 11.121 9.07786 10.6834 9.51545C10.2458 9.95303 10 10.5465 10 11.1654" stroke="#ECFDF8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            </Link>
                        </div>
                    </div>
                    <div className="input__side flex items-center justify-between gap-2 rounded-full w-full border border-[#eeeeee] p-1 pl-3 sm:pl-2 mt-7">

                        <Typography textsize="xs" classstyle="!text-txtSec font-medium sm:!text-xs truncate">https://candleweb.io/blog?id={blog?.blog_slug}</Typography>
                        <Button variant='transparent' classstyle={" !font-bold !border-txt-yellow hover:!border-txt-yellow !px-3 !text-txt-yellow !py-2 sm:!p-1"} onClick={async () => {
                            const copied = await copyToClipboard(`https://candleweb.io/blog?id=${blog?.blog_slug}`);
                            if (copied) {
                                success("Copied to clipboard");
                            }
                            // copy(`https://candleweb.io/register?referral=${user.username}`, {
                            //   message: "Link copied",
                            //   onCopy: (obj) => success("Copied to clipboard"),
                            // })
                        }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 7.667C5 6.95967 5.28099 6.28131 5.78115 5.78115C6.28131 5.28099 6.95967 5 7.667 5H16.333C16.6832 5 17.03 5.06898 17.3536 5.20301C17.6772 5.33704 17.9712 5.53349 18.2189 5.78115C18.4665 6.0288 18.663 6.32281 18.797 6.64638C18.931 6.96996 19 7.31676 19 7.667V16.333C19 16.6832 18.931 17.03 18.797 17.3536C18.663 17.6772 18.4665 17.9712 18.2189 18.2189C17.9712 18.4665 17.6772 18.663 17.3536 18.797C17.03 18.931 16.6832 19 16.333 19H7.667C7.31676 19 6.96996 18.931 6.64638 18.797C6.32281 18.663 6.0288 18.4665 5.78115 18.2189C5.53349 17.9712 5.33704 17.6772 5.20301 17.3536C5.06898 17.03 5 16.6832 5 16.333V7.667Z" stroke="#FFB322" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.012 14.737C1.705 14.5626 1.44965 14.31 1.2719 14.0049C1.09415 13.6998 1.00034 13.3531 1 13V3C1 1.9 1.9 1 3 1H13C13.75 1 14.158 1.385 14.5 2" stroke="#FFB322" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>

                        </Button>
                        {/* </CopyToClipboard> */}


                    </div>
                </div>
            </Modal>
        </>
    )
}

export default BlogDetails