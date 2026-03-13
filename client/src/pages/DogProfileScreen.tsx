import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SectionHeader } from "@/components/SectionHeader";
import { PedigreeTree } from "@/components/PedigreeTree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, MapPin, User, Dna } from "lucide-react";
import type { Dog, ShowResult, Pedigree } from "@shared/schema";

function ResultRow({ result }: { result: ShowResult }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0" data-testid={`row-result-${result.id}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{result.showName}</p>
        <p className="text-xs text-muted-foreground">{result.className} &middot; {result.date}</p>
      </div>
      <Badge variant="default" className="shrink-0 text-xs">{result.award}</Badge>
    </div>
  );
}

function isPedigreePopulated(pedigree: Pedigree | any[] | null | undefined): pedigree is Pedigree {
  if (!pedigree || Array.isArray(pedigree)) return false;
  return pedigree.gen1 !== undefined;
}

export default function DogProfileScreen() {
  const [, params] = useRoute("/dogs/:id");
  const dogId = params?.id;

  const { data: response, isLoading, isError } = useQuery<{
    success: boolean;
    data: { dog: Dog; showResults: ShowResult[]; pedigree: Pedigree | any[] };
  }>({
    queryKey: ["/api/dogs", dogId],
    enabled: !!dogId,
  });

  const dog = response?.data?.dog;
  const dogResults = response?.data?.showResults ?? [];
  const pedigree = response?.data?.pedigree;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/dogs">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (isError || !dog) {
    return (
      <AppLayout>
        <div className="p-4">
          <Link href="/dogs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <p className="text-center text-muted-foreground mt-8" data-testid="text-dog-not-found">
            {isError ? "Failed to load dog details. Please try again." : "Dog not found."}
          </p>
        </div>
      </AppLayout>
    );
  }

  const initials = dog.dog_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const age = (() => {
    if (!dog.dob) return "Unknown";
    const birth = new Date(dog.dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years > 0) return `${years}y ${months >= 0 ? months : 12 + months}m`;
    return `${months >= 0 ? months : 12 + months}m`;
  })();

  const hasPedigree = isPedigreePopulated(pedigree);

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-6">
        <div className="flex items-center gap-2">
          <Link href="/dogs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold truncate" data-testid="text-dog-profile-name">{dog.dog_name}</h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-28 w-28">
            <AvatarImage src={dog.imageUrl || undefined} alt={dog.dog_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            {dog.KP && (
              <p className="text-sm text-muted-foreground" data-testid="text-dog-reg">KP: {dog.KP}</p>
            )}
            {dog.titles.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                {dog.titles.map((title) => (
                  <Badge key={title} variant="default" className="text-xs">{title}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <AppCard className="p-4 space-y-3" data-testid="card-dog-details">
          <SectionHeader title="Details" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Dna className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Breed</p>
                <p className="text-sm font-medium">{dog.breed}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Sex</p>
                <p className="text-sm font-medium">{dog.sex}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="text-sm font-medium">{dog.dob || "Unknown"}</p>
                {dog.dob && <p className="text-xs text-muted-foreground">({age})</p>}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Color</p>
                <p className="text-sm font-medium">{dog.color || "Unknown"}</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-3 space-y-2">
            {dog.owner ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Owner</span>
                <span className="text-sm font-medium" data-testid="text-dog-owner">{dog.owner}</span>
              </div>
            ) : null}
            {dog.breeder && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Breeder</span>
                <span className="text-sm font-medium" data-testid="text-dog-breeder">{dog.breeder}</span>
              </div>
            )}
            {dog.microchip && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Microchip</span>
                <span className="text-sm font-medium font-mono" data-testid="text-dog-microchip">{dog.microchip}</span>
              </div>
            )}
          </div>
        </AppCard>

        {hasPedigree && (
          <AppCard className="p-4 space-y-3" data-testid="card-dog-pedigree">
            <SectionHeader title="4-Generation Pedigree" />
            <PedigreeTree pedigree={pedigree} />
          </AppCard>
        )}

        {dogResults.length > 0 && (
          <AppCard className="p-4 space-y-2" data-testid="card-dog-results">
            <SectionHeader title="Show Results" />
            <div>
              {dogResults.map((result) => (
                <ResultRow key={result.id} result={result} />
              ))}
            </div>
          </AppCard>
        )}
      </div>
    </AppLayout>
  );
}
