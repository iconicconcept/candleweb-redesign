import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FiArrowUpRight } from "react-icons/fi";
import BlogDetails from "./[id]";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";
import { AppDispatch } from "../../redux/store";
import blogService from "../../services/blogService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { BlogCategory, BlogProp } from "../../types/blog";
import { imageUri } from "../../utils/constants";
/* eslint-disable react/no-unescaped-entities */

const fallbackCategories = [
  "All",
  "Press Release",
  "Cryptocurrency Trading",
  "Tutorial",
  "Article",
];
const fallbackPosts = [
  [
    "The Emotional Side of Investing: Why Smart Professionals Lose Money",
    "The problem most professionals struggle with isn't knowledge - it's what happens to judgement when a position moves against them.",
    "Article",
  ],
  [
    "The 5 Silent Money Traps Keeping African Professionals Stuck",
    "Why many African professionals feel financially stuck, and the five habits that quietly keep them there.",
    "Article",
  ],
];

function Cover({
  blog,
  tone = "teal",
}: {
  blog?: BlogProp;
  tone?: "teal" | "amber";
}) {
  return (
    <div className={`blog-cover ${tone}`}>
      {blog?.photo ? (
        <Image
          src={imageUri + blog.photo}
          alt={blog.title}
          fill
          sizes="(max-width: 700px) 100vw, 50vw"
          className="blog-cover-image"
        />
      ) : (
        <>
          <span className="blog-cover-chart" />
          <span className="blog-cover-label">Cover image · from API</span>
        </>
      )}
    </div>
  );
}
function Meta({ blog, category }: { blog?: BlogProp; category?: string }) {
  return (
    <div className="blog-meta">
      <span>
        {blog
          ? new Date(blog.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Candleweb journal"}
      </span>
      <b>{category || blog?.category?.name || "Article"}</b>
    </div>
  );
}
function Card({
  blog,
  fallback,
  tone = "teal",
  featured = false,
}: {
  blog?: BlogProp;
  fallback?: string[];
  tone?: "teal" | "amber";
  featured?: boolean;
}) {
  const title = blog?.title || fallback?.[0] || "Candleweb journal";
  const excerpt =
    blog?.content?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    fallback?.[1] ||
    "Notes on trading infrastructure, automation and building with care.";
  return (
    <article className={`blog-post ${featured ? "featured" : ""}`}>
      <Link href={blog ? `/blog?id=${blog.blog_slug}` : "#"}>
        <Cover blog={blog} tone={tone} />
      </Link>
      <Meta blog={blog} category={fallback?.[2]} />
      <Link href={blog ? `/blog?id=${blog.blog_slug}` : "#"}>
        <h3>{title}</h3>
        <p>
          {excerpt}
          {excerpt.length >= 158 ? "..." : ""}
        </p>
      </Link>
      <div className="blog-tags">
        <span>{blog?.tags?.[0]?.name || fallback?.[2] || "Trading"}</span>
        {(blog?.tags?.[1] || fallback) && (
          <span>{blog?.tags?.[1]?.name || "Investment"}</span>
        )}
      </div>
    </article>
  );
}

export default function Blog() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const [blogs, setBlogs] = useState<BlogProp[]>([]);
  const [recents, setRecents] = useState<BlogProp[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const id = router.query.id;

  // useAxiosAuth() is a fresh instance each render — keep it in a ref so it is
  // not an effect dependency (otherwise the fetch loops on every render).
  const axiosRef = useRef(axiosToken);
  axiosRef.current = axiosToken;

  useEffect(() => {
    if (id) return;
    let mounted = true;
    Promise.all([
      dispatch(blogService.getBlogs(axiosRef.current)).unwrap(),
      dispatch(blogService.getRecentBlogs(axiosRef.current)).unwrap(),
      dispatch(blogService.getCategoryList(axiosRef.current)).unwrap(),
    ])
      .then(([all, recent, cats]) => {
        if (!mounted) return;
        setBlogs(all || []);
        setRecents(recent || []);
        setCategories(cats || []);
      })
      .catch(() => undefined)
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id]);
  const filtered = useMemo(
    () =>
      category === "all"
        ? blogs
        : blogs.filter((blog) => blog.category?.category_slug === category),
    [blogs, category],
  );
  const visible = filtered.slice((page - 1) * 6, page * 6);
  const featured = recents[0] || blogs[0];
  if (id) return <BlogDetails id={id.toString()} />;

  return (
    <>
      <Head>
        <title>Blog | Candleweb</title>
        <meta
          name="description"
          content="Tutorials, trading notes and product news from Candleweb."
        />
      </Head>
      <main className="blog-stage">
        <div className="blog-aura" />
        <div className="blog-grid" />
        <PublicHeader active="blog" />
        <div className="landing-wrap">
          <header className="blog-feature">
            <div>
              <p className="blog-eyebrow">Featured</p>
              <h1>
                {featured?.title ||
                  "Ideas for building better trading systems."}
              </h1>
              <p className="blog-lede">
                {featured
                  ? "A practical guide from the Candleweb desk, covering the decisions, tools and infrastructure behind agentic trading."
                  : "Tutorials, trading notes and release news for people building their own agents."}
              </p>
              <Meta blog={featured} category="Tutorial" />
              <Link
                href={featured ? `/blog?id=${featured.blog_slug}` : "#"}
                className="blog-btn blog-btn-amber blog-read"
              >
                Read more <FiArrowUpRight />
              </Link>
            </div>
            <Link
              href={featured ? `/blog?id=${featured.blog_slug}` : "#"}
              className="blog-feature-image"
            >
              <Cover blog={featured} />
            </Link>
          </header>
          <section className="blog-section blog-recent">
            <p className="blog-eyebrow">Recent posts</p>
            <h2>Latest from the desk.</h2>
            <div className="blog-recent-grid">
              <Card blog={recents[1]} fallback={fallbackPosts[0]} featured />
              <Card
                blog={recents[2]}
                fallback={fallbackPosts[1]}
                tone="amber"
                featured
              />
            </div>
          </section>
          <section className="blog-band">
            <div className="blog-wrap blog-section">
              <div className="blog-archive-head">
                <div>
                  <p className="blog-eyebrow">The archive</p>
                  <h2>All blog posts</h2>
                </div>
                <div className="blog-filters">
                  {fallbackCategories
                    .concat(categories.map((item) => item.name))
                    .filter((item, index, list) => list.indexOf(item) === index)
                    .map((item) => {
                      const slug =
                        item === "All"
                          ? "all"
                          : categories.find((entry) => entry.name === item)
                              ?.category_slug ||
                            item.toLowerCase().replace(/ /g, "-");
                      return (
                        <button
                          key={item}
                          aria-pressed={category === slug}
                          onClick={() => {
                            setCategory(slug);
                            setPage(1);
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                </div>
              </div>
              <div className="blog-post-grid">
                {loading
                  ? [1, 2, 3].map((item) => (
                      <div className="blog-skeleton" key={item} />
                    ))
                  : visible.length
                    ? visible.map((blog) => <Card key={blog.id} blog={blog} />)
                    : fallbackPosts.map((post, index) => (
                        <Card
                          key={post[0]}
                          fallback={post}
                          tone={index ? "amber" : "teal"}
                        />
                      ))}
              </div>
              {filtered.length > 6 && (
                <div className="blog-pagination">
                  {Array.from(
                    { length: Math.ceil(filtered.length / 6) },
                    (_, index) => (
                      <button
                        key={index}
                        aria-current={page === index + 1}
                        onClick={() => setPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>
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
                <small>
                  Unsubscribe any time. We don't share your address.
                </small>
              </form>
            </div>
          </section>
        </div>
        <PublicFooter />
      </main>
    </>
  );
}
