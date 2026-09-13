// `indicators` is documented as a comma/space string on read, but the API
// has been observed sending it back as a string[] too — handle both so a
// shape mismatch doesn't crash the trades pages.
export const indicatorChips = (raw: string | string[] | null | undefined): string[] => {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  return (raw || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};
