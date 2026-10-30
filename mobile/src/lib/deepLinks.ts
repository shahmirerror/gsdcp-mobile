import * as Linking from "expo-linking";
import { navigationRef } from "../navigation/navigationRef";
import { searchDogs } from "./api";

/**
 * Deep-link handling for shared dog-profile web links.
 *
 * The public web uses a friendly slug, not an id:
 *   https://gsdcp.org/view_dogs/{foreign_reg_no}-{name}
 * where only the FIRST space of the name is a hyphen (call name ↔ kennel) and
 * the rest stay as spaces (URL-encoded). Since there's no id in the URL, we
 * recover a searchable name from the slug, look the dog up via the API, and
 * navigate to its profile.
 *
 * Opening happens through:
 *  - Universal Links (iOS, `associatedDomains`) / App Links (Android,
 *    `intentFilters` autoVerify) once the association files are hosted, and
 *  - the `gsdcp://` custom scheme as a fallback.
 */

/** Turn a view_dogs slug back into a searchable dog name. */
function slugToQuery(slug: string): string {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    // keep raw slug if it isn't valid percent-encoding
  }
  s = s.trim();
  // Drop the leading {foreign_reg_no} prefix (everything up to and including the
  // first "-"; empty for local dogs → a bare leading "-"), then turn the
  // remaining hyphens back into spaces to recover the name.
  const afterPrefix = s.includes("-") ? s.slice(s.indexOf("-") + 1) : s;
  return afterPrefix.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/** Extract the `view_dogs` slug from any incoming URL (https or custom scheme). */
function extractDogSlug(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const full = [parsed.hostname, parsed.path].filter(Boolean).join("/");
    const m = full.match(/view_dogs\/(.+)$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function navigateToDog(id: string, name: string): void {
  if (!navigationRef.isReady()) {
    // Navigator not mounted yet (e.g. cold start from a link) — retry shortly.
    setTimeout(() => navigateToDog(id, name), 500);
    return;
  }
  navigationRef.navigate("DogsTab", {
    screen: "DogProfile",
    params: { id, name },
  });
}

async function openDogFromSlug(slug: string): Promise<void> {
  const query = slugToQuery(slug);
  if (!query) return;
  const norm = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();
  // `slugToQuery` strips the foreign-reg prefix by the FIRST hyphen, which leaves
  // a leading reg fragment when the reg itself contains hyphens (e.g. the slug
  // "SZ-2357289-Cuba-vom die Besten" yields "2357289 Cuba vom die Besten"). Search
  // by the recovered name and, if nothing matches, drop leading tokens until a
  // result surfaces — so the dog resolves regardless of the reg format.
  let candidate = query;
  try {
    for (let i = 0; i < 3 && candidate; i++) {
      const results = await searchDogs(candidate, 1, 15);
      if (results.length > 0) {
        const exact = results.find((d) => norm(d.dog_name) === norm(candidate));
        const dog = exact ?? results[0];
        navigateToDog(String(dog.id), dog.dog_name);
        return;
      }
      const sp = candidate.indexOf(" ");
      if (sp === -1) break;
      candidate = candidate.slice(sp + 1).trim();
    }
  } catch {
    // Network/search failure — silently ignore; the link just won't deep-link.
  }
}

/** Handle a single incoming URL. Exported for testing / manual invocation. */
export async function handleDeepLink(url: string | null): Promise<void> {
  if (!url) return;
  const slug = extractDogSlug(url);
  if (slug) await openDogFromSlug(slug);
}

let initialized = false;

/**
 * Wire up deep-link handling. Call once on app start. Returns a cleanup fn.
 * Handles both the cold-start URL and links received while running.
 */
export function initDeepLinks(): () => void {
  if (initialized) return () => {};
  initialized = true;

  Linking.getInitialURL()
    .then((url) => handleDeepLink(url))
    .catch(() => {});

  const sub = Linking.addEventListener("url", ({ url }) => {
    void handleDeepLink(url);
  });

  return () => {
    sub.remove();
    initialized = false;
  };
}
