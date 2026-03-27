const BASE_URL = "https://gsdcp.org/api/mobile";

export type PaginationMeta = {
  perPage: number;
  currentPage: number;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
  hasMorePages: boolean;
};

export type DogsPage = {
  data: Dog[];
  pagination: PaginationMeta;
};

export async function fetchDogsPage(
  page: number = 1,
  filters?: { search?: string; gender?: string },
): Promise<DogsPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (filters?.search) params.set("q", filters.search);
  if (filters?.gender && filters.gender !== "All") params.set("gender", filters.gender);
  const res = await fetch(`${BASE_URL}/dogs?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch dogs");
  return { data: json.data, pagination: json.pagination };
}

export async function fetchDog(id: string): Promise<DogDetail> {
  const res = await fetch(`${BASE_URL}/dogs/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch dog");
  return json.data;
}

export type DogOwner = {
  member_id: string;
  name: string;
  membership_no: string;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
};

export type Dog = {
  id: string;
  dog_name: string;
  KP: string | null;
  breed: string;
  sex: string;
  dob: string | null;
  color: string | null;
  imageUrl: string | null;
  owner: DogOwner[] | null;
  breeder: string | null;
  sire: string | null;
  sire_id: string | null;
  dam: string | null;
  dam_id: string | null;
  titles: string[];
  microchip: string | null;
  foreign_reg_no: string | null;
  hair: string | null;
  hd: string | null;
  ed: string | null;
  working_title: string | null;
  dna_status: string | null;
  breed_survey_period: string | null;
  show_rating: string | null;
};

export type LineBreedingDog = {
  id: string;
  dog_name: string;
  positions: string[];
  sides: string[];
  kennel?: string | null;
  litter_letter: string | null;
};

export type LineBreedingEntry = {
  type: string;
  id?: string;
  dog_name: string;
  positions: string[];
  sides: string[];
  litter_letter: string | null;
  kennel?: string | null;
  dogs?: LineBreedingDog[];
};

export type ShowResult = {
  id: string;
  showEventId: string;
  showName: string;
  dogId: string;
  dogName: string;
  grading: string;
  placement: string;
  className: string;
  date: string;
};

export type PedigreeAncestor = {
  id: number;
  dog_name: string;
  sex?: string;
  [key: string]: any;
} | string | null;

export type PedigreeGen = Record<string, PedigreeAncestor>;

export type Pedigree = {
  gen1: PedigreeGen;
  gen2: PedigreeGen;
  gen3: PedigreeGen;
  gen4: PedigreeGen;
};

export type ProgenyPartner = {
  id: string;
  dog_name: string;
  show_title: string | null;
  dob: string | null;
  image: string | null;
  KP: string | null;
  regestration_no: string | null;
};

export type ProgenyPuppy = {
  id: string;
  dog_name: string;
  show_title: string | null;
  sex: string | null;
  breed: string | null;
  dob: string | null;
  KP: string | null;
  regestration_no: string | null;
  partner_id: string | null;
};

export type ProgenyPuppyImage = {
  id: string;
  default: string | null;
  image: string | null;
  partner_id: string | null;
};

export type ProgenyEntry = {
  partner: ProgenyPartner;
  partner_type: "dam" | "sire" | string;
  puppies: ProgenyPuppy[];
  puppy_images: ProgenyPuppyImage[];
};

export type HereditaryGrades = {
  norm: number;
  fnorm: number;
  jperm: number;
  mid: number;
  sev: number;
  total?: number;
};

export type HereditaryData = {
  kids?: HereditaryGrades | null;
  sire?: HereditaryGrades | null;
  dam?: HereditaryGrades | null;
};

export type DogDetail = {
  dog: Dog;
  showResults: ShowResult[];
  pedigree: Pedigree | any[];
  siblings: Dog[];
  line_breeding: LineBreedingEntry[];
  progeny: ProgenyEntry[];
  hd_hereditary?: HereditaryData | null;
  ed_hereditary?: HereditaryData | null;
};

export type ShowJudge = {
  id: string;
  full_name: string;
  credentials?: string;
  imageUrl?: string;
};

export type Show = {
  id: string;
  name: string;
  event_type: string;
  dates: string[];
  location: string | null;
  judges: ShowJudge[];
  status: string;
  entryCount: number;
  last_date_of_entry: string | null;
};

export type ShowResultEntry = {
  dog_id: string;
  dog_name: string;
  sex: string;
  KP: string | null;
  foreign_reg_no: string | null;
  grading: string;
  placement: string;
  class: string;
  imageUrl: string | null;
  hair: string | null;
};

export type ShowDetail = Show & {
  showResults: ShowResultEntry[] | null;
};

export async function fetchShows(): Promise<Show[]> {
  const res = await fetch(`${BASE_URL}/shows`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch shows");
  return json.data;
}

export async function fetchShow(id: string): Promise<ShowDetail> {
  const res = await fetch(`${BASE_URL}/shows/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch show");
  return json.data;
}

export type RemainingDog = {
  id: string;
  dog_name: string;
  KP: string;
  sex?: string | null;
  color?: string | null;
  hair?: string | null;
  foreign_reg_no?: string | null;
  date_of_birth?: string | null;
  sire_name?: string | null;
  sire_KP?: string | null;
  dam_name?: string | null;
  dam_KP?: string | null;
};

export async function fetchRemainingDogs(showId: string, userId?: number | null, token?: string | null): Promise<RemainingDog[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const params = new URLSearchParams({ show_id: showId });
  if (userId != null) params.set("user_id", String(userId));
  const res = await fetch(`${BASE_URL}/fetch-remaining-dogs?${params.toString()}`, { headers });
  const text = await res.text();
  if (!text || !text.trim().startsWith("{")) return [];
  let json: any;
  try { json = JSON.parse(text); } catch { return []; }
  if (!json.success) throw new Error(json.message ?? "Failed to fetch remaining dogs");
  // Response shape: { success: true, data: { dogs: [...] } }
  const raw = json.data?.dogs ?? json.data;
  const list: any[] = Array.isArray(raw) ? raw : [];
  return list.map((d: any) => ({
    id: String(d.id ?? "").replace(/^dog-/, ""),
    dog_name: d.name ?? d.dog_name ?? "",
    KP: d.KP ?? "",
    sex: d.sex ?? null,
    color: d.color ?? null,
    hair: d.hair ?? null,
    foreign_reg_no: d.foreign_reg_no ?? null,
    date_of_birth: d.date_of_birth ?? null,
    sire_name: d.sire?.name ?? null,
    sire_KP: d.sire?.KP ?? null,
    dam_name: d.dam?.name ?? null,
    dam_KP: d.dam?.KP ?? null,
  })).filter((d) => d.dog_name);
}

export type MeetingStatus = "reserved" | "not_entered" | "no_seat_found";

export type MeetingStatusResult = {
  status: MeetingStatus;
  message: string;
};

export async function fetchMeetingStatus(
  showId: string,
  userId?: number | null,
  token?: string | null,
): Promise<MeetingStatusResult> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const params = new URLSearchParams({ show_id: showId });
  if (userId != null) params.set("user_id", String(userId));
  const res = await fetch(`${BASE_URL}/fetch-remaining-dogs?${params.toString()}`, { headers });
  const text = await res.text();
  if (!text || !text.trim().startsWith("{")) throw new Error("Invalid response from server.");
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Invalid response from server."); }
  const code: string = json.error?.code ?? json.code ?? "";
  if (code === "NOT_ENTERED") {
    return { status: "not_entered", message: json.error?.message || json.message || "" };
  }
  if (code === "NO_SEAT_FOUND") {
    return {
      status: "no_seat_found",
      message: json.error?.message || json.message || "No seats are available for this meeting.",
    };
  }
  return { status: "reserved", message: "Your seat is reserved for this meeting." };
}

export async function bookMeetingSeat(
  showId: string,
  userId: number,
  token?: string | null,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const payload = {
    show_id: Number(String(showId).replace(/^show-/, "")),
    user_id: userId,
  };
  const res = await fetch(`${BASE_URL}/show-entry`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let json: any = {};
  try {
    const text = await res.text();
    json = JSON.parse(text);
  } catch {
    throw new Error("Invalid response from server.");
  }
  if (json.exception) {
    throw new Error(json.message ? `Server error: ${json.message}` : "A server error occurred. Please try again.");
  }
  if (json.success === false) {
    const msg =
      (typeof json.error === "string" ? json.error : null) ??
      json.error?.message ??
      json.message ??
      "Booking failed. Please try again.";
    throw new Error(msg);
  }
}

export type VerifyEntryResult = {
  eligible: boolean;
  reason?: string;
  className?: string;
  classId?: number;
};

export async function verifyEntry(
  showId: string,
  dogId: string,
  token?: string | null,
): Promise<VerifyEntryResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const payload = {
    show_id: Number(String(showId).replace(/^show-/, "")),
    dog_id: Number(String(dogId).replace(/^dog-/, "")),
  };
  const res = await fetch(`${BASE_URL}/verify-entry`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let json: any = {};
  try {
    const text = await res.text();
    json = JSON.parse(text);
  } catch {
    throw new Error("invalid-response");
  }
  // Only treat as server error if it's a PHP crash (has exception field, no success field)
  if (json.exception && json.success === undefined) {
    throw new Error("server-error");
  }
  if (json.success) return {
    eligible: true,
    className: json.data?.class_name ?? undefined,
    classId: json.data?.class_id ?? undefined,
  };
  const reason =
    (typeof json.error === "string" ? json.error : null) ??
    json.error?.message ??
    json.error?.msg ??
    json.message ??
    json.msg ??
    "Dog is not eligible for this show";
  return { eligible: false, reason };
}

export type SubmitEntryPayload = {
  show_id: number;
  user_id: number;
  dogs: number[];
  sex: string[];
  classes: string[];
};

export async function submitEntry(
  showId: string,
  userId: number,
  dogs: { id: string; sex?: string | null }[],
  classes: string[],
  token?: string | null,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const payload: SubmitEntryPayload = {
    show_id: Number(String(showId).replace(/^show-/, "")),
    user_id: userId,
    dogs: dogs.map((d) => Number(String(d.id).replace(/^dog-/, ""))),
    sex: dogs.map((d) => d.sex ?? ""),
    classes,
  };
  const res = await fetch(`${BASE_URL}/show-entry`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let json: any = {};
  try {
    const text = await res.text();
    json = JSON.parse(text);
  } catch {
    throw new Error("Invalid response from server.");
  }
  if (json.exception) {
    const msg = json.message
      ? `Server error: ${json.message}`
      : "A server error occurred. Please try again.";
    throw new Error(msg);
  }
  if (json.success === false) {
    const msg =
      (typeof json.error === "string" ? json.error : null) ??
      json.error?.message ??
      json.message ??
      "Submission failed. Please try again.";
    throw new Error(msg);
  }
}

export type Breeder = {
  id: string;
  name: string;
  kennelName: string;
  location: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  membership_no: string | null;
  imageUrl: string;
  activeSince: string | null;
  totalDogs: number;
  description: string | null;
};

export async function fetchBreeders(): Promise<Breeder[]> {
  const res = await fetch(`${BASE_URL}/breeders`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch breeders");
  return json.data;
}

export type BreederDog = {
  id: string;
  name: string;
  KP: string | null;
  foreign_reg_no: string | null;
  breed: string;
  sex: string;
  dateOfBirth: string | null;
  color: string | null;
  imageUrl: string;
  owner: string | null;
  breeder: string | null;
  sire: string | null;
  dam: string | null;
  titles: string[];
  microchipNumber: string | null;
};

export type BreederDetail = {
  breeder: Breeder;
  dogsBred: BreederDog[];
  dogsOwned: BreederDog[];
};

export async function fetchBreeder(id: string): Promise<BreederDetail> {
  const res = await fetch(`${BASE_URL}/breeders/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch breeder");
  return json.data;
}

export type MatingDog = {
  name: string;
  id: string;
  KP: string | null;
  foreign_reg_no: string | null;
  hair: string | null;
  imageUrl: string | null;
  color: string | null;
};

export type RecentMating = {
  id: string;
  kennel_id: string;
  kennel_name: string;
  kennel_image: string | null;
  sire: MatingDog;
  dam: MatingDog;
  mating_date: string;
  city: string | null;
  litter_on_ground?: boolean;
};

export async function fetchRecentMatings(): Promise<RecentMating[]> {
  const res = await fetch(`${BASE_URL}/recent-matings`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch recent matings");
  const seen = new Set<string>();
  return (json.data.upcomingLitters as RecentMating[]).filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export type DashboardMating = {
  kennel_name: string;
  sire_name: string;
  dam_name: string;
  sire_dog_id: string;
  dam_dog_id: string;
  mating_date: string;
  city: string | null;
};

export type DashboardData = {
  totalDogs: number;
  totalKennels: number;
  totalShows: number;
  upcomingShows: Show[];
  recentMatings: DashboardMating[];
};

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${BASE_URL}/dashboard`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch dashboard");
  return json.data;
}

export type Kennel = {
  id: string;
  kennelName: string;
  location: string;
  phone: string | null;
  email: string | null;
  city: string;
  country: string;
  imageUrl: string;
  activeSince: string;
  description: string | null;
};

export async function fetchKennels(): Promise<Kennel[]> {
  const res = await fetch(`${BASE_URL}/kennels`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch kennels");
  return json.data;
}

export type KennelMating = {
  sire_name: string;
  dam_name: string;
  mating_date: string;
  sire_dog_id: string;
  dam_dog_id: string;
};

export type KennelOwner = {
  name: string;
  phone: string | null;
  email: string | null;
  membership_no: string | null;
};

export type KennelFull = Kennel & {
  suffix: string | null;
  prefix: string | null;
};

export type KennelDetail = {
  kennels: KennelFull;
  matings: KennelMating[];
  kennelOwners: KennelOwner[];
};

export async function fetchKennelDetail(id: string): Promise<KennelDetail> {
  const res = await fetch(`${BASE_URL}/kennels/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch kennel detail");
  return json.data;
}

export function stripHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&uuml;/gi, "ü")
    .replace(/&auml;/gi, "ä")
    .replace(/&ouml;/gi, "ö")
    .replace(/&szlig;/g, "ß")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type JudgeItem = {
  judge_id: string;
  full_name: string;
  credentials: string;
  description: string;
  imageUrl: string;
};

export async function fetchJudges(): Promise<JudgeItem[]> {
  const res = await fetch(`${BASE_URL}/judges`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch judges");
  return json.data.judges;
}

export async function fetchVisitingJudges(): Promise<JudgeItem[]> {
  const res = await fetch(`${BASE_URL}/visiting-judges`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch visiting judges");
  return json.data.visiting_judges;
}

export type JudgeShow = {
  id: string;
  title: string;
  start_date: string;
  venue: string | null;
  city: string;
  type: string;
};

export type JudgeDetail = JudgeItem & {
  description: string;
  shows?: JudgeShow[];
};

export async function fetchJudgeDetail(id: string): Promise<JudgeDetail> {
  const res = await fetch(`${BASE_URL}/all-judges/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch judge detail");
  const judgesArr = json.data.judges;
  const judge = Array.isArray(judgesArr) ? judgesArr[0] : judgesArr;
  return { ...judge, shows: json.data.shows || [] };
}

export type AboutItem = { id: number; content: string };
export type RuleItem = { id: number; rule_name: string; content: string };
export type NewsItem = { id: number; title: string; content: string };
export type FeeItem = {
  id: number;
  option_name: string;
  option_value: string;
  remarks: string | null;
  explanation: string | null;
};

export async function fetchAbout(): Promise<AboutItem[]> {
  const res = await fetch(`${BASE_URL}/about`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch about");
  return json.data.about;
}

export async function fetchRules(): Promise<RuleItem[]> {
  const res = await fetch(`${BASE_URL}/rules`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch rules");
  return json.data.rules;
}

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(`${BASE_URL}/news`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch news");
  return json.data.news;
}

export async function fetchFees(): Promise<FeeItem[]> {
  const res = await fetch(`${BASE_URL}/fees`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch fees");
  return json.data.fees;
}

export type Member = {
  id: string;
  member_name: string;
  membership_no: string;
  imageUrl: string | null;
  city: string | null;
  country: string | null;
};

export type MembersPage = {
  data: Member[];
  pagination: PaginationMeta;
};

export type MemberOwnedDog = {
  id: string;
  dog_name: string;
  KP: string;
  foreign_reg_no: string;
  breed: string;
  hair: string;
  sex: string;
  dob: string | null;
  color: string;
  imageUrl: string | null;
  owner: string;
  breeder: string;
  sire: string;
  dam: string;
  titles: string[];
  microchip: string | null;
};

export type MemberKennel = {
  kennel_id: string;
  kennelName: string;
  suffix: string | null;
  prefix: string | null;
  city: string | null;
  country: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  description: string | null;
  active_since: string | null;
};

export type MemberDetail = {
  member: Member & {
    address: string | null;
    check_email: "Show" | "Hide";
    check_phone: "Show" | "Hide";
    check_address: "Show" | "Hide";
  };
  ownedDogs: MemberOwnedDog[];
  kennel: MemberKennel | null;
};

export async function fetchMemberDetail(id: string): Promise<MemberDetail> {
  const res = await fetch(`${BASE_URL}/members/${id}`);
  if (!res.ok) throw new Error("Failed to fetch member detail");
  const text = await res.text();
  if (text.trim().startsWith("<")) throw new Error("Server returned HTML");
  const json = JSON.parse(text);
  if (!json.success) throw new Error("Failed to fetch member detail");
  return {
    member: json.data.member,
    ownedDogs: json.data.ownedDogs ?? [],
    kennel: json.data.kennel ?? null,
  };
}

export async function fetchMembersPage(
  page: number = 1,
  options?: { q?: string },
): Promise<MembersPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (options?.q) params.set("q", options.q);
  const res = await fetch(`${BASE_URL}/members?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch members");
  return {
    data: Object.values(json.data) as Member[],
    pagination: json.pagination as PaginationMeta,
  };
}

/* ── Stud Certificates ─────────────────────────────────── */

export type StudCertificate = {
  id: string;
  sire: { id: number; name: string; KP: string; foreign_reg_no: string | null };
  dam:  { id: number; name: string; KP: string; foreign_reg_no: string | null };
  mating_date: string;
  status: string | null;
};

export type StudCertificateDetail = {
  id: string;
  sire: { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; date_of_birth: string | null; imageUrl: string | null };
  dam:  { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; date_of_birth: string | null; imageUrl: string | null };
  mating_date: string;
  status: string | null;
};

export async function fetchStudCertificateDetail(certId: string, userId: number): Promise<StudCertificateDetail> {
  // certId may be "stud-1762" or "1762" — both work
  const res = await fetch(`${BASE_URL}/stud-certificates/${certId}?user_id=${userId}`, {
    headers: { Accept: "application/json" },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Failed to fetch certificate detail");
  return json.data;
}

export type StudCertPayload = {
  user_id: number;
  sire_id: number;
  dam_id: number;
  mating_date: string;
};

export async function fetchStudCertificates(
  userId: number, page = 1, perPage = 10
): Promise<{ certificates: StudCertificate[]; total: number }> {
  const res = await fetch(`${BASE_URL}/stud-certificates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ user_id: userId, page, per_page: perPage }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Failed to fetch stud certificates");
  return {
    certificates: Array.isArray(json.data?.certificates) ? json.data.certificates : [],
    total: json.data?.total ?? 0,
  };
}

export async function submitStudCertificate(payload: StudCertPayload, token?: string | null): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/new-stud-certificate`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? json.error?.message ?? "Submission failed. Please try again.");
  }
}

/* ── Litter Inspections ─────────────────────────────── */
export type LitterInspection = {
  id: string;
  sire: { id: string; name: string; KP: string; foreign_reg_no: string | null };
  dam:  { id: string; name: string; KP: string; foreign_reg_no: string | null };
  male_puppies: string | null;
  female_puppies: string | null;
  expired_puppies: string | null;
  total_puppies: number | null;
  whelping_date: string | null;
  status: string | null;
};

export type LitterInspectionDetail = {
  id: string;
  sire: { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; date_of_birth: string | null; imageUrl: string | null };
  dam:  { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; date_of_birth: string | null; imageUrl: string | null };
  male_puppies: string | null;
  female_puppies: string | null;
  expired_puppies: string | null;
  total_puppies: number | null;
  whelping_date: string | null;
  status: string | null;
};

export type LitterInspectionPayload = {
  user_id: number;
  sire_id?: number;
  dam_id?: number;
  sire_name: string;
  sire_kp: string;
  dam_name: string;
  dam_kp: string;
  date_of_whelping: string;
  date_of_inspection: string;
  total_puppies?: string;
  male_pups: string;
  female_pups: string;
  dead_pups: string;
  inspector_name: string;
  remarks: string;
};

export async function fetchLitterInspections(
  userId: number, page = 1, perPage = 10
): Promise<{ inspections: LitterInspection[]; total: number }> {
  const res = await fetch(`${BASE_URL}/litter-inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ user_id: userId, page, per_page: perPage }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? json.message ?? "Failed to fetch litter inspections");
  return {
    inspections: Array.isArray(json.data?.inspections) ? json.data.inspections : [],
    total: json.data?.total ?? 0,
  };
}

export async function fetchLitterInspectionDetail(id: string, userId: number): Promise<LitterInspectionDetail> {
  // List returns IDs like "inspect-170"; detail URL needs just the number "170"
  const numericId = id.replace(/^inspect-/, "");
  const res = await fetch(`${BASE_URL}/litter-inspections/${numericId}?user_id=${userId}`, {
    headers: { Accept: "application/json" },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? json.message ?? "Failed to fetch litter inspection detail");
  return json.data;
}

export type CertificateCheck = {
  found: boolean;
  matingDate: string | null;
  message: string;
};

export async function checkLitterCertificate(sireId: string, damId: string, userId?: number): Promise<CertificateCheck> {
  const sNum = parseInt(sireId.replace(/^dog-/, ""), 10);
  const dNum = parseInt(damId.replace(/^dog-/, ""), 10);
  const res = await fetch(`${BASE_URL}/litter-inspections/checkcertificate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sire_id: sNum, dam_id: dNum }),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Invalid response"); }

  // Happy path
  if (json.success === true) {
    return { found: true, matingDate: json.data?.mating_date ?? json.data?.date ?? null, message: json.message ?? "Stud certificate found" };
  }
  // "No stud cert" — returned correctly even on HTTP 500
  if (json.error?.code === "STUD_CERTIFICATE_ERROR") {
    return { found: false, matingDate: null, message: json.error.message ?? "No stud certificate found" };
  }
  // Backend crash: "Undefined variable: stud" fires when a cert IS found but response-building fails.
  // Fall back to the stud certificates list to retrieve the mating date.
  if (json.exception === "ErrorException" && typeof json.message === "string" && json.message.toLowerCase().includes("stud")) {
    if (userId) {
      try {
        const { certificates } = await fetchStudCertificates(userId, 1, 100);
        const match = certificates.find(c => {
          const cSire = String(c.sire.id).replace(/^dog-/, "");
          const cDam  = String(c.dam.id).replace(/^dog-/, "");
          return cSire === String(sNum) && cDam === String(dNum);
        });
        if (match) {
          return { found: true, matingDate: match.mating_date ?? null, message: "Stud certificate found" };
        }
      } catch { /* fallthrough */ }
    }
    return { found: true, matingDate: null, message: "Stud certificate found (details unavailable)" };
  }
  // Other backend crash — genuinely unknown
  throw new Error(json.message ?? "Server error");
}

export async function submitLitterInspection(payload: LitterInspectionPayload): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/new-litter-inspection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkErr: any) {
    // "Failed to fetch" on the POST itself — backend may have redirected to a
    // cross-origin URL (CORS block on the redirect target). Treat as success
    // since the record was written before the redirect was issued.
    console.warn("[submitLitterInspection] network/CORS error (likely redirect):", networkErr);
    return;
  }
  // Opaque redirect or plain redirect response — backend accepted the request
  if (res.type === "opaqueredirect" || res.status === 0 || (res.status >= 300 && res.status < 400)) return;
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch {
    if (res.ok) return;
    throw new Error("Submission failed. Please try again.");
  }
  if (json.success === false) {
    throw new Error(json.message ?? json.error?.message ?? "Submission failed. Please try again.");
  }
}

/* ── Litter Registrations ────────────────────────────── */
export type LitterRegistration = {
  id: string;
  sire: { id: string; name: string; KP: string; foreign_reg_no: string | null };
  dam:  { id: string; name: string; KP: string; foreign_reg_no: string | null };
  whelping_date: string | null;
  male_puppies: number | null;
  female_puppies: number | null;
  puppy_count: number | null;
  status: string | null;
  registration_no: string | null;
};

export type LitterPuppy = {
  id: number;
  name: string;
  puppy_full_name: string | null;
  sex: string | null;
  color: string | null;
  hair: string | null;
  microchip: string | null;
  DNA_taken: string | null;
  dead_check: string | null;
  dog_id: number | null;
};

export type LitterRegistrationDetail = {
  id: string;
  sire: { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; imageUrl: string | null };
  dam:  { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; imageUrl: string | null };
  dob: string | null;
  puppies: LitterPuppy[];
  male_puppies: number | null;
  female_puppies: number | null;
  puppy_count: number | null;
  status: string | null;
  registration_no: string | null;
};

export type LitterRegistrationPayload = {
  user_id: number;
  kennel_id?: string | null;
  sire_id?: number;
  sire_name: string;
  sire_kp: string;
  dam_id?: number;
  dam_name: string;
  dam_kp: string;
  date_of_whelping: string;
  male_pups: string;
  female_pups: string;
  remarks: string;
  puppies?: { name: string; sex: string; color: string }[];
};

export type LitterRegStats = {
  total: number;
  microchipped: number;
  submitted: number;
  approved: number;
  rejected: number;
};

export async function fetchLitterRegistrations(
  userId: number, page = 1, perPage = 10
): Promise<{ registrations: LitterRegistration[]; total: number; stats: LitterRegStats }> {
  const res = await fetch(`${BASE_URL}/litter-registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ user_id: userId, page, per_page: perPage }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? json.message ?? "Failed to fetch litter registrations");
  return {
    registrations: Array.isArray(json.data?.registrations) ? json.data.registrations : [],
    total: json.data?.total ?? 0,
    stats: {
      total:       json.data?.total        ?? 0,
      microchipped: json.data?.microchipped ?? 0,
      submitted:   json.data?.submitted    ?? 0,
      approved:    json.data?.approved     ?? 0,
      rejected:    json.data?.rejected     ?? 0,
    },
  };
}

export async function fetchLitterRegistrationDetail(id: string, userId: number): Promise<LitterRegistrationDetail> {
  const numericId = id.replace(/^litt-/, "");
  const res = await fetch(`${BASE_URL}/litter-registrations/${numericId}?user_id=${userId}`, {
    headers: { Accept: "application/json" },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? json.message ?? "Failed to fetch litter registration detail");
  return json.data;
}

export type LitterInspectionCheck = {
  found: boolean;
  matingDate: string | null;
  message: string;
};

export async function checkLitterInspection(
  sireId: string | number,
  damId:  string | number,
  dateOfWhelping: string,   // YYYY-MM-DD
): Promise<LitterInspectionCheck> {
  const sNum = parseInt(String(sireId).replace(/^dog-/, ""), 10);
  const dNum = parseInt(String(damId).replace(/^dog-/, ""), 10);
  const res = await fetch(`${BASE_URL}/litter-registration/checkinspection`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sire_id: sNum, dam_id: dNum, date_of_whelping: dateOfWhelping }),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Invalid response"); }
  if (json.success === true) {
    return { found: true, matingDate: json.data?.mating_date ?? null, message: json.message ?? "Inspection verified" };
  }
  return { found: false, matingDate: null, message: json.error?.message ?? json.message ?? "No matching inspection found" };
}

export async function submitLitterRegistration(payload: LitterRegistrationPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/new-litter-registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? json.error?.message ?? "Submission failed. Please try again.");
  }
}

export function getAncestorName(ancestor: PedigreeAncestor): string {
  if (!ancestor) return "Unknown";
  if (typeof ancestor === "string") return ancestor || "Unknown";
  return ancestor.dog_name || "Unknown";
}

export function getAncestorId(ancestor: PedigreeAncestor): string | null {
  if (!ancestor || typeof ancestor === "string") return null;
  if (ancestor.id == null) return null;
  return `dog-${ancestor.id}`;
}

export type SireVerification = {
  eligible: boolean;
  message: string;
};

export async function verifySire(dogId: string, userId: number): Promise<SireVerification> {
  const numericId = parseInt(dogId.replace(/^dog-/, ""), 10);
  const res = await fetch(`${BASE_URL}/stud-certificates/verify_sire`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sire_id: numericId, user_id: userId }),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Invalid response"); }
  if (!res.ok && json.success == null) throw new Error(json.message ?? "Server error");
  const errorMsg = json.error?.message ?? json.message ?? null;
  if (json.success === false) return { eligible: false, message: errorMsg ?? "Not eligible" };
  if (json.success === true)  return { eligible: true,  message: json.data?.message ?? json.message ?? "" };
  return { eligible: true, message: "" };
}

export async function verifyDam(dogId: string, userId: number, sireId?: string): Promise<SireVerification> {
  const numericId = parseInt(dogId.replace(/^dog-/, ""), 10);
  const numericSireId = sireId ? parseInt(sireId.replace(/^dog-/, ""), 10) : undefined;
  const res = await fetch(`${BASE_URL}/stud-certificates/verify_dam`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ dam_id: numericId, user_id: userId, ...(numericSireId ? { sire_id: numericSireId } : {}) }),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error("Invalid response"); }
  if (!res.ok && json.success == null) throw new Error(json.message ?? "Server error");
  const errorMsg = json.error?.message ?? json.message ?? null;
  if (json.success === false) return { eligible: false, message: errorMsg ?? "Not eligible" };
  if (json.success === true)  return { eligible: true,  message: json.data?.message ?? json.message ?? "" };
  return { eligible: true, message: "" };
}

export type DogSearchResult = {
  id: string;
  dog_name: string;
  KP: string;
  sex: string;
  color: string;
  owner: string;
};

export async function searchDogs(query: string, page = 1, perPage = 10, sex?: string): Promise<DogSearchResult[]> {
  const params: Record<string, string> = { q: query, page: String(page), per_page: String(perPage) };
  if (sex) params.gender = sex.toLowerCase();
  const res = await fetch(`${BASE_URL}/dogs?${new URLSearchParams(params)}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to search dogs");
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}
