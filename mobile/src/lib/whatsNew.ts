export type WhatsNewEntry = {
  version: string;
  changes: string[];
};

/**
 * Add a new entry here (at the TOP) every time you ship a new version.
 * The version string must match the "version" field in app.json / eas.json.
 */
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: "1.0.0",
    changes: [
      "Initial release of the GSDCP Mobile App",
      "Dog search with full pedigree profiles",
      "Breeder and kennel directory",
      "Show schedules and live results",
      "Member directory",
      "Recent matings browser",
      "Virtual breeding tool",
      "Push notifications for show updates",
    ],
  },
];

export function getChangesForVersion(version: string): string[] | null {
  const entry = WHATS_NEW.find((e) => e.version === version);
  return entry?.changes ?? null;
}
