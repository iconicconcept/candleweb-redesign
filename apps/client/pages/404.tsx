import ErrorStage, { IS_ERROR_PAGE } from "../components/public/ErrorStage";

/** A real 404 — the URL does not match a page. Statically optimised, so it is
 *  served from the CDN even when nothing else is reachable. */
export default function NotFoundPage() {
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

NotFoundPage.isErrorPage = IS_ERROR_PAGE;
