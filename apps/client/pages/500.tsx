import ErrorStage, { IS_ERROR_PAGE } from "../components/public/ErrorStage";

/** A server-side failure. Kept static for the same reason as 404: the page
 *  that explains an outage must not need the thing that is out. */
export default function ServerErrorPage() {
  return (
    <ErrorStage
      code={500}
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

ServerErrorPage.isErrorPage = IS_ERROR_PAGE;
