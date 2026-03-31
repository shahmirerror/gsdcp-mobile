const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Formats an API date string (YYYY-MM-DD) as "D Month, YYYY".
 * Returns "—" for null/undefined, or the raw string if parsing fails.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  if (isNaN(day) || monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${day} ${MONTHS_FULL[monthIndex]}, ${year}`;
}
