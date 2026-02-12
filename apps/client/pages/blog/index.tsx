import React, { useEffect, useMemo, useState } from 'react'
import { BotImage, Button, Heading, HeroBgIcon, splitByThirds } from 'ui'
import { BsArrowUpRight } from "react-icons/bs";
import Image from 'next/image';
import BlogCard from '../../components/Blog/BlogCard';
import { TabPill } from '../../components/Blog/CategoriesPill';
import { Pagination, PaginationItem } from '@mui/material';
import { useMediaQuery } from '@react-hook/media-query';
import Head from 'next/head';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import blogService from '../../services/blogService';
import useAxiosAuth from '../../lib/hooks/useAxiosAuth';
import { BlogCategory, BlogProp } from '../../types/blog';
import Loader from '../../components/Loader';
import { BlogSkeletonLoader } from '../../components/dashboard/skeleton/SkeletonLoader';
import { imageUri } from '../../utils/constants';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BlogDetails from './[id]';

type Props = {}

const Blog = (props: Props) => {
    const isMobile = useMediaQuery("only screen and (max-width: 600px)");
    const isTablet = useMediaQuery("only screen and (max-width: 769px)");
    const router = useRouter();
    const { id } = router.query
    const [blogData, setBlogData] = useState<{
        blogs?: BlogProp[],
        recents?: BlogProp[],
        filteredBlogs?: BlogProp[],
        categories?: BlogCategory[],
        isLoading?: boolean,
        currentActiveCategory?: string,
        currentPage?: number
    }>({
        isLoading: true,
        currentActiveCategory: 'all',
        currentPage: 1
    });


    const dispatch = useDispatch<AppDispatch>()
    const axiosToken = useAxiosAuth();

    const blogs = useMemo(async () => {
        const blogs = await dispatch(blogService.getBlogs(axiosToken)).unwrap();
        const recentBlogs = await dispatch(blogService.getRecentBlogs(axiosToken)).unwrap();
        const blogCategories = await dispatch(blogService.getCategoryList(axiosToken)).unwrap();
        setBlogData({
            ...blogData,
            isLoading: false,
            blogs,
            recents: recentBlogs,
            categories: blogCategories
        });
        return blogs;
    }, []);

    const startIndex = (blogData!.currentPage! - 1) * 6;
    const endIndex = Math.min(startIndex + 6, (blogData?.filteredBlogs ?? blogData?.blogs)?.length ?? 0);


    return (
        id ? <BlogDetails id={id.toString()} /> :
            <>
                <Head>
                    <title>Blog - Candleweb</title>
                    <meta name="description" content="Maximize trading success with CandleWeb! AI-powered CandleAI analyzes real-time data, giving a competitive edge in crypto. Utilize advanced algorithms, minimize risks, and maximize profits. Start achieving financial goals with CandleWeb and $CDE token. Access advanced tools for profitable trades in cryptocurrency." />
                    <meta name="keywords" content="AI crypto trading, trading bots, market analysis, real-time data, automation, profitable strategies, backtesting, CandleWeb, CandleAI, $CDE token" />
                    <meta property="og:title" content="CandleWeb - AI-Powered Trading Platform for Profitable Trades" />
                    <link rel="canonical" href="https://candleweb.io" />
                    <link rel="icon" href="/favicon.ico" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                {blogData.isLoading && <Loader />}
                <div className=''>
                    <div className="mt-32">
                        {/* HERO SECTION */}
                        <section className="hero__section pb-16 max-w-[1065px] flex items-center m-auto px-10 sm:flex-col gap-10">
                            {blogData?.isLoading && <BlogSkeletonLoader />}
                            {blogData?.isLoading && <BlogSkeletonLoader />}
                            {blogData?.recents && blogData?.recents.length > 0 && <div className="hero__left--details">
                                <Link href={'/blog?id=' + blogData?.recents[0].blog_slug}>

                                    <Heading textsize='3xl' classstyle='inter tb:!text-3xl'>
                                        {splitByThirds(blogData?.recents[0].title).firstThird} {" "}
                                        <span className='text_gradient'>{splitByThirds(blogData?.recents[0].title).lastThird}</span>
                                    </Heading>
                                </Link>
                                <div className="h-10 tb:h-9"></div>
                                <Button variant='primary' classstyle='' iconright icon={<BsArrowUpRight />} onClick={() => {
                                    if (blogData?.recents) {
                                        router.push("/blog?id=" + blogData.recents[0].blog_slug);
                                    }
                                }}>Read more</Button>
                            </div>}
                            <div className="hero__right--image relative w-full min-w-[300px] max-w-[600px] max-h-[400px] overflow-hidden rounded-lg">

                                {blogData?.recents && blogData?.recents.length > 0 && (
                                    <Link href={'/blog?id=' + blogData?.recents[0].blog_slug} className='block relative max-w-[600px] h-[400px] min-w-full'>
                                        <Image src={imageUri + blogData?.recents[0].photo} alt='Hero Image' fill className='object-cover' />
                                    </Link>

                                )}
                            </div>
                        </section>
                        {/* RECENT BLOG POST SECTION */}
                        {blogData?.recents && blogData?.recents[1] && <section className="recent__blog max-w-[1065px] m-auto py-20 px-10">
                            {/* Titlte */}
                            <Heading textsize='sm' classstyle='tb:text-center'>Recent Blog Posts</Heading>
                            <div className="recent__blog--content mt-4 flex items-start gap-5 tb:flex-col tb:items-center">
                                <div className="recent__blog--leftblog">
                                    {blogData?.isLoading && <BlogSkeletonLoader />}
                                    {blogData?.recents && blogData?.recents[1] && <BlogCard vertical={true} blog={blogData.recents[1]} />}
                                </div>
                                <div className="recent__blog--rightblogs flex flex-col gap-10">
                                    {blogData?.isLoading && <BlogSkeletonLoader />}
                                    {blogData?.isLoading && <BlogSkeletonLoader />}
                                    {blogData?.recents && blogData?.recents[2] && <BlogCard vertical={!blogData?.recents[3] || isTablet} reduceCategories blog={blogData.recents[2]} />}
                                    {blogData?.recents && blogData?.recents[3] && <BlogCard vertical={isTablet} reduceCategories blog={blogData.recents[3]} />}
                                </div>
                            </div>
                        </section>}
                        {/* ALL BLOGS */}
                        <section className="all__blogs py-16">
                            <div className="all__blogs--tabs bg-[#0f0f0f] w-full py-5 px-10">
                                <div className="blog__tab--lists max-w-[1065px] m-auto flex items-center gap-7 w-full flex-nowrap lg:px-3 whitespace-nowrap lg:scroll-smooth lg:overflow-x-scroll lg:hide-scroll-bar -my-7 py-7 no__scroll sm:!mx-3 sm:gap-5">
                                    <TabPill text='All' active={blogData.currentActiveCategory === "all"} slug={"all"} onclick={(slug) => setBlogData((prev) => ({ ...prev, filteredBlogs: undefined, currentActiveCategory: slug, currentPage: 1 }))} />
                                    {blogData.categories && blogData.categories.map((category: BlogCategory, index: number) => (

                                        <TabPill text={category.name} active={blogData.currentActiveCategory === category.category_slug} slug={category.category_slug} onclick={(slug) => setBlogData((prev) => ({ ...prev, filteredBlogs: slug === "all" ? [] : blogData.blogs?.filter((blog: BlogProp) => blog.category.category_slug === slug), currentActiveCategory: slug, currentPage: 1 }))} />
                                    ))}
                                </div>
                            </div>
                            <div className="all__blogs--contents max-w-[1065px] m-auto py-10 px-10">
                                {/* TITLE */}
                                <Heading textsize='sm'>All Blog Posts</Heading>
                                <div className="blogs__contents grid grid-cols-3 gap-y-8 gap-x-6 py-10 tb:grid-cols-2 sm:!grid-cols-1">
                                    {blogData?.isLoading && <BlogSkeletonLoader />}
                                    {blogData?.isLoading && <BlogSkeletonLoader />}
                                    {blogData?.isLoading && <BlogSkeletonLoader />}
                                    {blogData?.blogs && (blogData?.filteredBlogs ?? blogData?.blogs).slice(startIndex, endIndex).map((blog: BlogProp, index: number) => (
                                        <BlogCard vertical blog={blog} />
                                    ))}
                                </div>
                            </div>
                            <div className="all__blogs--pagination flex justify-center">
                                <Pagination count={Math.ceil(((blogData?.filteredBlogs ?? blogData.blogs)?.length ?? 0) / 6)}
                                    // color='primary'
                                    page={blogData.currentPage}
                                    onChange={(e, page) => setBlogData((prev) => ({ ...prev, currentPage: page }))}
                                    sx={{
                                        '& .MuiPaginationItem-text': {
                                            color: 'white'
                                        }
                                    }}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </>
    )
}

export default Blog