import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, MapPin, User, Dna, Award } from "lucide-react";
import { mockDogs, mockShowResults } from "@/lib/mock-data";
import type { ShowResult } from "@shared/schema";

function PedigreeCard({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium truncate" data-testid={`text-pedigree-${label.toLowerCase()}`}>
        {name}
      </p>
    </div>
  );
}

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

export default function DogProfileScreen() {
  const [, params] = useRoute("/dogs/:id");
  const dogId = params?.id;
  const dog = mockDogs.find((d) => d.id === dogId);

  if (!dog) {
    return (
      <AppLayout>
        <div className="p-4">
          <Link href="/dogs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <p className="text-center text-muted-foreground mt-8" data-testid="text-dog-not-found">Dog not found.</p>
        </div>
      </AppLayout>
    );
  }

  const dogResults = mockShowResults.filter((r) => r.dogId === dog.id);

  const initials = dog.dog_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const age = (() => {
    const birth = new Date(dog.dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years > 0) return `${years}y ${months >= 0 ? months : 12 + months}m`;
    return `${months >= 0 ? months : 12 + months}m`;
  })();

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
            <AvatarImage src={dog.imageUrl} alt={dog.dog_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-sm text-muted-foreground" data-testid="text-dog-reg">{dog.KP}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              {dog.titles.map((title) => (
                <Badge key={title} variant="default" className="text-xs">{title}</Badge>
              ))}
            </div>
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
                <p className="text-sm font-medium">{dog.dob}</p>
                <p className="text-xs text-muted-foreground">({age})</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Color</p>
                <p className="text-sm font-medium">{dog.color}</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Owner</span>
              <span className="text-sm font-medium" data-testid="text-dog-owner">{dog.owner}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Breeder</span>
              <span className="text-sm font-medium" data-testid="text-dog-breeder">{dog.breeder}</span>
            </div>
            {dog.microchip && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Microchip</span>
                <span className="text-sm font-medium font-mono" data-testid="text-dog-microchip">{dog.microchip}</span>
              </div>
            )}
          </div>
        </AppCard>

        <AppCard className="p-4 space-y-3" data-testid="card-dog-pedigree">
          <SectionHeader title="Pedigree" />
          <div className="flex gap-4">
            <PedigreeCard label="Sire" name={dog.sire} />
            <PedigreeCard label="Dam" name={dog.dam} />
          </div>
        </AppCard>

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
