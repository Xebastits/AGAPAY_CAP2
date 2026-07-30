// src/lib/format.ts
// Shared helpers for comma-formatted number inputs/displays (e.g. ₱100,000
// instead of ₱100000), so users are less likely to mistype large amounts.

// Strips everything except digits — use this to recover the "raw" numeric
// string from a comma-formatted display value before storing/submitting it.
export const stripCommas = (value: string): string => value.replace(/[^\d]/g, "");

// Formats a raw digit string/number as a comma-grouped string for display,
// e.g. "100000" -> "100,000". Safe to call on "" (returns "").
export const formatNumberWithCommas = (value: string | number): string => {
  const raw = stripCommas(String(value ?? ""));
  if (!raw) return "";
  return Number(raw).toLocaleString("en-US");
};
