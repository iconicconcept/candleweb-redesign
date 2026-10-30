import DOMPurify from "dompurify";

/**
 * Cleans HTML that comes from the API — blog posts, task and reward
 * descriptions — before it is rendered with dangerouslySetInnerHTML.
 * Formatting tags survive; scripts, event handlers and javascript: links
 * do not.
 *
 * DOMPurify needs a DOM, so on the server this returns "". Every caller
 * fetches its content in the browser, so the server render never had any
 * to show — and nothing unsanitised can slip through that way either.
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html || typeof window === "undefined") return "";
  return DOMPurify.sanitize(html);
};
