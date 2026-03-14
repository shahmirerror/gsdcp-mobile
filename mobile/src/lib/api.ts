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

export async function fetchDogsPage(page: number = 1): Promise<DogsPage> {
  const res = await fetch(`${BASE_URL}/dogs?page=${page}`);
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
  line_breeding: LineBreedingEntry[];
};

export type LineBreedingEntry = {
  type: string;
  id: number;
  dog_name: string;
  positions: string[];
  sides: string[];
  litter_letter: string | null;
};

export type ShowResult = {
  id: string;
  showEventId: string;
  showName: string;
  dogId: string;
  dogName: string;
  handler: string;
  award: string;
  placement: number;
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
};

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
