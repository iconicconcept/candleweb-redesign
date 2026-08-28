import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { formatBlogTime } from "ui";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import { BlogProp } from "../../types/blog";
import { AppDispatch } from "../../redux/store";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import blogService from "../../services/blogService";
import { imageUri } from "../../utils/constants";
import useCopyToClipboard from "../../lib/hooks/useClipboard";
import { success } from "../../components/alert/Toast";
/* eslint-disable react/no-unescaped-entities */

type Props = { id?: string };

type TocItem = { id: string; text: string };

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function buildArticle(content?: string): { html: string; toc: TocItem[] } {
  if (!content) return { html: "", toc: [] };
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const withIds = content.replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
    (_match, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const base = slugify(text);
      let unique = base;
      let index = 2;
      while (used.has(unique)) unique = `${base}-${index++}`;
      used.add(unique);
      toc.push({ id: unique, text });
      return `<h2 id="${unique}"${attrs}>${inner}</h2>`;
    },
  );
  return { html: withIds.replace(/<strong>/g, "<br /><strong>"), toc };
}

function RelatedCard({ blog }: { blog: BlogProp }) {
  return (
    <article className="blog-post">
      <Link href={`/blog?id=${blog.blog_slug}`}>
        <div className="blog-cover teal">
          {blog.photo ? (
            <Image
              src={imageUri + blog.photo}
              alt={blog.title}
              fill
              sizes="(max-width: 700px) 100vw, 33vw"
              className="blog-cover-image"
            />
          ) : (
            <>
              <span className="blog-cover-chart" />
              <span className="blog-cover-label">Cover image · from API</span>
            </>
          )}
        </div>
      </Link>
      <div className="blog-meta">
        <span>{formatBlogTime(blog.created_at)}</span>
        <b>{blog.category?.name || "Article"}</b>
      </div>
      <Link href={`/blog?id=${blog.blog_slug}`}>
        <h3>{blog.title}</h3>
        <p>{blog.content?.replace(/<[^>]+>/g, "").slice(0, 120)}</p>
      </Link>
      <div className="blog-tags">
        {(blog.tags?.length
          ? blog.tags.slice(0, 2)
          : [{ id: 0, name: "Trading" }]
        ).map((tag) => (
          <span key={tag.id}>{tag.name}</span>
        ))}
      </div>
    </article>
  );
}

export default function BlogDetails({ id }: Props) {
  const router = useRouter();
  const slug = id || (router.query.id as string) || "";
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { copyToClipboard } = useCopyToClipboard();
  const [blog, setBlog] = useState<BlogProp | null>(null);
  const [recents, setRecents] = useState<BlogProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");

  // useAxiosAuth() returns a fresh instance every render, so it must NOT be an
  // effect dependency — keep it in a ref and re-run only when the slug changes.
  const axiosRef = useRef(axiosToken);
  axiosRef.current = axiosToken;

  useEffect(() => {
    if (!router.isReady) return;
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setBlog(null);
    Promise.all([
      dispatch(blogService.getBlog({ api: axiosRef.current, id: slug })).unwrap(),
      dispatch(blogService.getRecentBlogs(axiosRef.current))
        .unwrap()
        .catch(() => [] as BlogProp[]),
    ])
      .then(([data, recent]) => {
        if (cancelled) return;
        setBlog(data ?? null);
        setRecents(recent || []);
      })
      .catch(() => {
        if (!cancelled) setBlog(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, slug, router.isReady]);

  const { html, toc } = useMemo(
    () => buildArticle(blog?.content),
    [blog?.content],
  );

  const readingTime = useMemo(() => {
    const words = (blog?.content || "")
      .replace(/<[^>]+>/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [blog?.content]);

  useEffect(() => {
    if (!blog) return;
    const article = document.getElementById("blog-article");
    const bar = document.getElementById("blog-progress");
    const onScroll = () => {
      if (!article || !bar) return;
      const total = article.offsetHeight - window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (window.scrollY - article.offsetTop) / (total || 1)),
      );
      bar.style.width = `${progress * 100}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const headings = document.querySelectorAll<HTMLElement>(
      ".blog-detail-prose h2",
    );
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) => entry.isIntersecting && setActiveId(entry.target.id),
        ),
      { rootMargin: "-20% 0px -70% 0px" },
    );
    headings.forEach((heading) => spy.observe(heading));
    return () => {
      window.removeEventListener("scroll", onScroll);
      spy.disconnect();
    };
  }, [blog, html]);

  const shareUrl = `https://candleweb.io/blog?id=${blog?.blog_slug || slug}`;
  const shareText = blog?.title || "Candleweb journal";
  const related = recents
    .filter((item) => item.blog_slug !== blog?.blog_slug && item.id !== blog?.id)
    .slice(0, 3);
  const description =
    blog?.content?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    "Candleweb trading and automation notes.";

  const copyLink = async () => {
    if (await copyToClipboard(shareUrl)) success("Link copied to clipboard");
  };

  return (
    <>
      <Head>
        <title>{blog?.title || "Blog article"} | Candleweb</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={blog?.title || "Candleweb"} />
        <meta property="og:description" content={description} />
        {blog?.photo && (
          <meta property="og:image" content={imageUri + blog.photo} />
        )}
      </Head>
      <main className="blog-stage">
        <div className="blog-detail-progress" id="blog-progress" />
        <div className="blog-aura" />
        <div className="blog-grid" />
        <PublicHeader active="blog" />

        <div className="landing-wrap">
          {loading ? (
            <div className="blog-detail-loading">Loading article…</div>
          ) : blog ? (
            <>
              <header className="blog-detail-head">
                <p className="blog-detail-crumb">
                  <Link href="/blog">‹ Blog</Link>
                  <span>/</span>
                  <span>{blog.category?.name || "Article"}</span>
                </p>
                <h1>{blog.title}</h1>
                <div className="blog-detail-meta">
                  <span className="date">{formatBlogTime(blog.created_at)}</span>
                  <span className="dot" />
                  <span>{readingTime} min read</span>
                  <span className="cat">{blog.category?.name || "Article"}</span>
                </div>
              </header>

              <div className="blog-detail-cover">
                {blog.photo ? (
                  <Image
                    src={imageUri + blog.photo}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 960px"
                    className="blog-detail-cover-image"
                    priority
                  />
                ) : (
                  <>
                    <span className="blog-detail-cover-fallback" />
                    <span className="ph">Cover image · from API</span>
                  </>
                )}
              </div>

              <div className="blog-detail-grid" id="blog-article">
                <div>
                  <div
                    className="blog-detail-prose"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />

                  <div className="blog-detail-cta">
                    <b>Ready to connect yours?</b>
                    <p>
                      Candleweb runs the market data, execution and monitoring
                      for the bot you already built — or lets CandleAI trade for
                      you if you'd rather not build one.
                    </p>
                    <Link href="/register" className="blog-btn blog-btn-amber">
                      Get Started ↗
                    </Link>
                  </div>

                  {Boolean(blog.tags?.length) && (
                    <div className="blog-detail-tagrow">
                      {blog.tags.map((tag) => (
                        <span key={tag.id}>{tag.name}</span>
                      ))}
                    </div>
                  )}

                  <div className="blog-detail-share">
                    <button type="button" onClick={copyLink}>
                      Copy link
                    </button>
                    <a
                      className="wa"
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      X
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      LinkedIn
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Telegram
                    </a>
                  </div>

                  <div className="blog-detail-byline">
                    <span className="bl">
                      <i />
                    </span>
                    <div>
                      <b>{blog.author?.name || "Candleweb"}</b>
                      <p>
                        Infrastructure for agentic trading, built in Africa. We
                        write about the unglamorous half of automated trading —
                        execution, monitoring, and the things that break at 3am.
                      </p>
                    </div>
                  </div>
                </div>

                <aside className="blog-detail-toc">
                  <span>On this page</span>
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={activeId === item.id ? "is-active" : ""}
                    >
                      {item.text}
                    </a>
                  ))}
                  <div className="toc-share">
                    <span>Share</span>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      X
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      LinkedIn
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="blog-detail-loading">
              This article could not be found.{" "}
              <Link href="/blog" style={{ color: "var(--blog-teal2)" }}>
                Back to the blog
              </Link>
            </div>
          )}

          {related.length > 0 && (
            <section className="blog-band">
              <div className="blog-wrap blog-section">
                <p className="blog-eyebrow">Keep reading</p>
                <h2>More from the desk.</h2>
                <div className="blog-post-grid">
                  {related.map((item) => (
                    <RelatedCard key={item.id} blog={item} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="blog-wrap blog-section">
            <div className="blog-subscribe">
              <div>
                <p className="blog-eyebrow">Stay in the loop</p>
                <h2>New posts, straight to your inbox.</h2>
                <p className="blog-lede">
                  Tutorials, trading notes and release news. Roughly twice a
                  month, and nothing else.
                </p>
              </div>
              <form onSubmit={(event) => event.preventDefault()}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email"
                  required
                />
                <button className="blog-btn blog-btn-amber" type="submit">
                  Subscribe ↗
                </button>
                <small>Unsubscribe any time. We don't share your address.</small>
              </form>
            </div>
          </section>
        </div>

        <PublicFooter />
      </main>
    </>
  );
}
