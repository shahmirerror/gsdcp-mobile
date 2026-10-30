import { fetchDog, Dog } from "./api";

/**
 * Helpers for assembling the "Litter on Ground!" share card. Parent sub-lines
 * read "{Title} | {Coat} | {HD}/{ED}".
 */

const s = (v: unknown): string =>
  v != null && String(v).trim().length > 0 ? String(v).trim() : "";

/** Any sire/dam object that may carry the pre-formatted title / coat / HD-ED. */
type ParentLike = {
  title?: string | number | null;
  hair?: string | number | null;
  hd_ed?: string | number | null;
};

/**
 * Build "{Title} | {Coat} | {HD/ED}" from a sire/dam object that already carries
 * `title` and `hd_ed` (pre-formatted "HD / ED") — no extra dog-profile fetch
 * needed. Omits empty parts. Returns "" when none of the fields are present, so
 * callers can fall back to a full profile fetch (fetchParentSub).
 */
export function parentSubFromMating(parent?: ParentLike | null): string {
  if (!parent) return "";
  const parts = [s(parent.title), s(parent.hair), s(parent.hd_ed)].filter(
    Boolean,
  );
  return parts.join(" | ");
}

/** Build "{Title} | {Coat} | {HD}/{ED}" from a dog detail. Omits empty parts. */
export function parentSubFromDog(dog?: Partial<Dog> | null): string {
  if (!dog) return "";
  const title =
    s(dog.show_rating) ||
    s(dog.working_title) ||
    (Array.isArray(dog.titles) ? dog.titles.join(" ").trim() : "");
  const coat = s(dog.hair);
  const hd = s(dog.hd);
  const ed = s(dog.ed);

  const parts: string[] = [];
  if (title) parts.push(title);
  if (coat) parts.push(coat);
  if (hd || ed) parts.push(`${hd || "—"}/${ed || "—"}`);
  return parts.join(" | ");
}

/** Fetch a dog and return its parent sub-line. Empty string on any failure. */
export async function fetchParentSub(
  dogId?: string | number | null,
): Promise<string> {
  const id = s(dogId);
  if (!id) return "";
  try {
    const detail = await fetchDog(id);
    return parentSubFromDog(detail?.dog);
  } catch {
    return "";
  }
}
