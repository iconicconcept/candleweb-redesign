/**
 * A course's `category` arrives as a list of tags, but not always in the same
 * shape: sometimes a real array, sometimes that array JSON-encoded as a string
 * (`'["AI"]'`), and on older courses a plain single name. Every caller wants
 * the same thing — a clean list of tag names — so normalise it here.
 */
export const courseCategories = (raw: unknown): string[] => {
  let value: unknown = raw;
  if (typeof value === "string") {
    const text = value.trim();
    if (text.startsWith("[")) {
      try {
        value = JSON.parse(text);
      } catch {
        value = text.replace(/^\[|\]$/g, "").split(",");
      }
    } else {
      value = text ? [text] : [];
    }
  }
  if (!Array.isArray(value)) return [];
  const tags = value
    .map((tag) => String(tag ?? "").trim().replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
};
