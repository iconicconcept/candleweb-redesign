import type { NextPageContext } from "next";
import ErrorStage, { IS_ERROR_PAGE } from "../components/public/ErrorStage";

/**
 * Everything 404 and 500 do not catch — including the one in the screenshot
 * this replaced: a client-side exception, where the response was fine and the
 * page's own JavaScript threw after it arrived.
 *
 * That case has no meaningful status code, so it shows none. It is also the
 * only case where "reload" is the right first move: the app is already in the
 * state that broke it, and navigating within it would re-enter that state.
 */
type Props = { statusCode?: number | null };

export default function ErrorPage({ statusCode }: Props) {
  if (statusCode === 404) {
    return (
      <ErrorStage
        code={404}
        title="We can't find"
        titleAccent="that page."
        docTitle="Page not found | Candleweb"
      >
        The link may be out of date, or the page may have moved since it was
        written down. Nothing is broken — this address just doesn&rsquo;t lead
        anywhere.
      </ErrorStage>
    );
  }

  if (statusCode == null) {
    return (
      <ErrorStage
        title="This page stopped"
        titleAccent="responding."
        showReload
        docTitle="This page stopped responding | Candleweb"
      >
        Something in the page itself failed after it loaded, so it can&rsquo;t
        finish drawing. Reloading usually clears it.
      </ErrorStage>
    );
  }

  return (
    <ErrorStage
      code={statusCode}
      title="Something broke"
      titleAccent="on our side."
      showReload
      docTitle="Something went wrong | Candleweb"
    >
      That one is ours, not yours. The request didn&rsquo;t get through — try it
      again in a moment, and if it keeps happening let us know what you were
      doing when it did.
    </ErrorStage>
  );
}

/* `statusCode` is null for a client-side exception: there was a response and
   it was fine, so inventing a 500 for it would be a lie the page then has to
   tell the user. */
ErrorPage.getInitialProps = ({ res, err }: NextPageContext): Props => ({
  statusCode: res?.statusCode ?? err?.statusCode ?? null,
});

ErrorPage.isErrorPage = IS_ERROR_PAGE;
