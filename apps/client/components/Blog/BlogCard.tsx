import Image from 'next/image'
import React from 'react'
import { BLOGIMAGE, Heading, Typography, formatBlogTime, formatDate, formatDateTime } from 'ui'
import { CategoriesPill } from './CategoriesPill'
import { FiArrowUpRight } from 'react-icons/fi'
import Link from 'next/link'
import { BlogProp } from '../../types/blog'
import { imageUri } from '../../utils/constants'

type Props = {
    vertical?: boolean;
    reduceCategories?: boolean;
    fullWidth?: boolean;
    blog: BlogProp;
}

const BlogCard = ({ vertical, reduceCategories, fullWidth, blog }: Props) => {
    return (
        <div className={`blog__card w-full ${vertical ? 'flex flex-col gap-5' : 'flex items-start gap-5'}`} style={{
            maxWidth: fullWidth ? "100%" : "500px"
        }}>
            <div className="blog__image w-full relative">
                <Link href={"/blog?id=" + blog.blog_slug} style={{ width: "100%" }} className='w-full h-full block'>
                    <Image src={imageUri + blog.photo} alt={`${blog.title} Image`} height={300} width={500} className='w-full h-full max-w-[500px] max-h-[300px]' />
                </Link>
            </div>
            <div className={`blog__details`}>


                <div className="blog__date text-primary font-medium text-xs inter">{formatBlogTime(blog.created_at)}</div>
                <div className="h-3"></div>
                <div className="blog__title flex items-center justify-between">
                    <Link href={"/blog?id=" + blog.blog_slug} style={{ width: "100%" }}>

                        <Heading textsize='md' classstyle='!font-medium inter'>{blog.title}</Heading>
                    </Link>
                    {vertical && <FiArrowUpRight className='text-txt-yellow text-2xl' />}
                </div>
                <div className="h-3"></div>
                <div className="blog__description">
                    <Link href={"/blog?id=" + blog.blog_slug} style={{ width: "100%" }}>

                        {/* Plain text: cutting HTML at 200 characters could split a tag, and a
                            card excerpt needs no markup to render. */}
                        <Typography textsize='xs' classstyle='!text-[#C0C5D0]'>{blog.content.replace(/<[^>]+>/g, "").substring(0, 200) + "..."}</Typography>
                    </Link>
                </div>
                <div className="h-3"></div>
                <div className="blog__categories flex items-center gap-2">
                    {blog.tags && blog.tags.slice(0, reduceCategories ? 2 : blog.tags.length).map((tag, index) => (
                        <CategoriesPill key={index + tag.id} text={tag.name} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default BlogCard