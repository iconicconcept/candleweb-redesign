import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AiOutlineShareAlt } from "react-icons/ai";
import { Button, Modal, formatBlogTime } from "ui";
import { BlogProp } from "../../types/blog";
import { AppDispatch } from "../../redux/store";
import { useDispatch } from "react-redux";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import blogService from "../../services/blogService";
import { imageUri } from "../../utils/constants";
import useCopyToClipboard from "../../lib/hooks/useClipboard";
import { success } from "../../components/alert/Toast";
/* eslint-disable react/no-unescaped-entities */

type Props = { id: string };

export default function BlogDetails({ id }: Props) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { copyToClipboard } = useCopyToClipboard();
  const [blog, setBlog] = useState<BlogProp | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    let mounted = true;
    dispatch(blogService.getBlog({ api: axiosToken, id }))
      .unwrap()
      .then((data) => mounted && setBlog(data ?? null))
      .catch(() => mounted && setBlog(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [axiosToken, dispatch, id, router.isReady]);

  const shareUrl = `https://candleweb.io/blog?id=${id}`;
  return (
    <>
      <Head>
        <title>{blog?.title || "Blog article"} | Candleweb</title>
        <meta
          name="description"
          content={
            blog?.content?.replace(/<[^>]+>/g, "").slice(0, 160) ||
            "Candleweb trading and automation notes."
          }
        />
      </Head>
      <main className="blog-detail-stage">
        <div className="blog-detail-wrap">
          <Link href="/blog" className="blog-detail-back">
            ← Back to the journal
          </Link>
          {loading ? (
            <div className="blog-detail-loading">Loading article...</div>
          ) : blog ? (
            <article>
              <header className="blog-detail-header">
                <div>
                  <p className="blog-detail-eyebrow">
                    {blog.category?.name || "Candleweb journal"}
                  </p>
                  <h1>{blog.title}</h1>
                  <div className="blog-detail-meta">
                    <span>{formatBlogTime(blog.created_at)}</span>
                    <span>·</span>
                    <span>{blog.author?.name || "Candleweb"}</span>
                    <button
                      aria-label="Share article"
                      onClick={() => setShareOpen(true)}
                    >
                      <AiOutlineShareAlt />
                    </button>
                  </div>
                  <div className="blog-detail-tags">
                    {blog.tags?.map((tag) => (
                      <span key={tag.id}>{tag.name}</span>
                    ))}
                  </div>
                </div>
              </header>
              <div className="blog-detail-hero">
                {blog.photo && (
                  <Image
                    src={imageUri + blog.photo}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 960px"
                    className="blog-detail-image"
                    priority
                  />
                )}
              </div>
              <div className="blog-detail-layout">
                <aside>
                  <span>In this article</span>
                  <button onClick={() => setShareOpen(true)}>
                    Share article <AiOutlineShareAlt />
                  </button>
                </aside>
                <div
                  className="blog-detail-content"
                  dangerouslySetInnerHTML={{
                    __html: blog.content.replace(/<strong>/g, "<br /><strong>"),
                  }}
                />
              </div>
            </article>
          ) : (
            <div className="blog-detail-loading">
              This article could not be found.
            </div>
          )}
          <Link href="/blog" className="blog-detail-footer-link">
            Read more from the journal ↗
          </Link>
        </div>
      </main>
      <Modal
        title="Share article"
        width="500px"
        isOpen={shareOpen}
        onChnage={setShareOpen}
      >
        <div className="blog-share-modal">
          <p>Share this article</p>
          <div className="blog-share-links">
            <Link
              href={`https://twitter.com/share?url=${shareUrl}`}
              target="_blank"
            >
              X
            </Link>
            <Link
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
            >
              f
            </Link>
            <Link
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
            >
              in
            </Link>
          </div>
          <div className="blog-copy-row">
            <span>{shareUrl}</span>
            <Button
              variant="transparent"
              onClick={async () => {
                if (await copyToClipboard(shareUrl))
                  success("Copied to clipboard");
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
