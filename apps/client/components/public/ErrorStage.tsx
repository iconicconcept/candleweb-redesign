import Head from "next/head";
import Link from "next/link";
import BrandLogo from "./BrandLogo";

/**
 * The page Candleweb shows when something has gone wrong.
 *
 * One component behind `404`, `500` and `_error`, because the three differ
 * only in what they say — the chrome, the reassurance and the ways out are
 * the same, and three copies of that would drift.
 *
 * ## Why it carries its own chrome
 *
 * It deliberately does **not** render `PublicHeader`. An error page has to be
 * the most robust page in the build: if what crashed the app was anything the
 * real header touches — the store, the notification poll, the theme hook —
 * then rendering that header here crashes the error page too, and the user
 * gets a blank screen instead of a way out. So this is a wordmark, a
 * headline, and links that are plain `<Link>`s. It reads as the new site
 * because it is built from the same stage, tokens and buttons as the landing
 * pages, not because it reuses their components.
 *
 * The theme needs no hook either: `_document` writes `data-site-theme` before
 * first paint, so the light rules at the foot of `landing.css` apply on their
 * own.
 */

type Props = {
  /** Shown as the eyebrow. Omitted for a client-side exception, which has no
   *  meaningful HTTP status — nothing was wrong with the response. */
  code?: number | null;
  title: string;
  /** The gradient half of the headline, as the landing pages set it. */
  titleAccent?: string;
  children: React.ReactNode;
  /** A full reload, for the cases where the page's own JavaScript is what
   *  failed and navigating within the app would re-enter the same broken
   *  state. */
  showReload?: boolean;
  docTitle: string;
};

const LINKS: { label: string; href: string }[] = [
  { label: "Bring your bot", href: "/" },
  { label: "CandleAI", href: "/candleai" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Academy", href: "/tutor" },
  { label: "Blog", href: "/blog" },
];

export default function ErrorStage({
  code,
  title,
  titleAccent,
  children,
  showReload = false,
  docTitle,
}: Props) {
  return (
    <>
      <Head>
        <title>{docTitle}</title>
        {/* An error page has nothing to offer a crawler, and a soft-404 in the
            index is worse than none at all. */}
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="landing-stage landing-err">
        <div className="landing-aura" />
        <div className="landing-grid" />

        <div className="landing-wrap landing-err-bar">
          <Link href="/" className="landing-err-brand" aria-label="Candleweb home">
            <BrandLogo height={20} priority />
          </Link>
        </div>

        <div className="landing-wrap landing-err-body">
          {code != null && <p className="landing-eyebrow">Error {code}</p>}
          <h1>
            {title}
            {titleAccent && (
              <>
                {" "}
                <span>{titleAccent}</span>
              </>
            )}
          </h1>
          <div className="landing-sub">{children}</div>

          {/* The one thing a trading product has to say here. Someone looking
              at an error page is wondering whether their money is moving, and
              the honest answer is that none of this ran in their browser. */}
          <p className="landing-err-safe">
            <i aria-hidden="true">✓</i>
            <span>
              <b>Your trades are not affected.</b> Candleweb runs them on its own
              servers and talks to your exchange whether or not this page loads
              — open positions keep their stops.
            </span>
          </p>

          <div className="landing-hero-cta landing-err-cta">
            <Link className="landing-btn landing-btn-amber" href="/">
              Back to home <span>↗</span>
            </Link>
            {showReload ? (
              <button
                type="button"
                className="landing-btn landing-btn-teal"
                onClick={() => window.location.reload()}
              >
                Reload this page
              </button>
            ) : (
              <Link className="landing-btn landing-btn-teal" href="/dashboard">
                Go to dashboard
              </Link>
            )}
          </div>

          <nav className="landing-err-links" aria-label="Elsewhere on Candleweb">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </>
  );
}

/* Marks every page built on this stage, so `_app` can tell `Layout` not to
   put the legacy header above it. Without it a crash on one of the pages that
   still uses that header renders the old chrome over the new error page —
   which is exactly what this replaces. */
export const IS_ERROR_PAGE = true;
