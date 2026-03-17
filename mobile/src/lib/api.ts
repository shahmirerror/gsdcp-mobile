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

export type Dog = {
  id: string;
  dog_name: string;
  KP: string | null;
  breed: string;
  sex: string;
  dob: string | null;
  color: string | null;
  imageUrl: string | null;
  owner: string | null;
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

export type DogDetail = {
  dog: Dog;
  showResults: ShowResult[];
  pedigree: Pedigree | any[];
  siblings: Dog[];
  line_breeding: LineBreedingEntry[];
};

export type ShowJudge = {
  id: string;
  full_name: string;
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
  seat: string;
  class: string;
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
