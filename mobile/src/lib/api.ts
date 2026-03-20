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

export type RecentMating = {
  id: string;
  kennel_id: string;
  kennel_name: string;
  sire_name: string;
  sire_dog_id: string;
  dam_name: string;
  dam_dog_id: string;
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

export type DashboardData = {
  totalDogs: number;
  totalKennels: number;
  totalShows: number;
  upcomingShows: Show[];
  recentMatings: RecentMating[];
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
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&uuml;/g, "ü")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&apos;/g, "'")
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
