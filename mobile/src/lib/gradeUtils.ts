const GRADE_ORDER: Record<string, number> = {
  "VA":      0,
  "VA (PK)": 1,
  "V":       2,
  "V (PK)":  3,
  "SG":      4,
  "G":       5,
  "VP":      6,
  "P":       7,
  "LP":      8,
  "S":       9,
  "D":       10,
  "NP":      11,
};

export function gradeIndex(grading: string | null | undefined): number {
  if (!grading) return 999;
  const g = grading.trim();
  if (g in GRADE_ORDER) return GRADE_ORDER[g];
  for (const [key, val] of Object.entries(GRADE_ORDER)) {
    if (g.startsWith(key)) return val;
  }
  return 998;
}
