const BASE_URL = "https://gsdcp.org/api/mobile";

export async function fetchDogs(): Promise<Dog[]> {
  const res = await fetch(`${BASE_URL}/dogs`);
  const json = await res.json();
  if (!json.success) throw new Error("Failed to fetch dogs");
  return json.data;
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
  dam: string | null;
  titles: string[];
  microchip: string | null;
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

export type Pedigree = {
  gen1: { sire: string; dam: string };
  gen2: { sire_sire: string; sire_dam: string; dam_sire: string; dam_dam: string };
  gen3: Record<string, string>;
  gen4: Record<string, string>;
};

export type DogDetail = {
  dog: Dog;
  showResults: ShowResult[];
  pedigree: Pedigree | any[];
};
