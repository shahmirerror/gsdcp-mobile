import { useRoute, Link, useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SectionHeader } from "@/components/SectionHeader";
import { DogListTile } from "@/components/DogListTile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Calendar, Phone, Mail, Users } from "lucide-react";
import { mockBreeders, mockDogs } from "@/lib/mock-data";

export default function BreederProfileScreen() {
  const [, params] = useRoute("/breeders/:id");
  const [, navigate] = useLocation();
  const breederId = params?.id;
  const breeder = mockBreeders.find((b) => b.id === breederId);

  if (!breeder) {
    return (
      <AppLayout>
        <div className="p-4">
          <Link href="/breeders">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <p className="text-center text-muted-foreground mt-8" data-testid="text-breeder-not-found">Breeder not found.</p>
        </div>
      </AppLayout>
    );
  }

  const breederDogs = mockDogs.filter((d) => d.breeder === breeder.name);

  const initials = breeder.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-6">
        <div className="flex items-center gap-2">
          <Link href="/breeders">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold truncate" data-testid="text-breeder-profile-name">{breeder.name}</h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-24 w-24">
            <AvatarImage src={breeder.imageUrl} alt={breeder.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-primary font-semibold text-lg" data-testid="text-kennel-name">{breeder.kennelName}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-muted-foreground flex-wrap">
              <MapPin className="h-3.5 w-3.5" />
              <span>{breeder.location}</span>
            </div>
          </div>
        </div>

        <AppCard className="p-4 space-y-3" data-testid="card-breeder-info">
          <SectionHeader title="About" />
          <p className="text-sm text-muted-foreground" data-testid="text-breeder-description">{breeder.description}</p>
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Active since</span>
              <span className="font-medium ml-auto">{breeder.activeSince}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Total dogs</span>
              <span className="font-medium ml-auto">{breeder.totalDogs}</span>
            </div>
          </div>
        </AppCard>

        <AppCard className="p-4 space-y-3" data-testid="card-breeder-contact">
          <SectionHeader title="Contact" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span data-testid="text-breeder-phone">{breeder.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span data-testid="text-breeder-email">{breeder.email}</span>
            </div>
          </div>
        </AppCard>

        {breederDogs.length > 0 && (
          <div className="space-y-3">
            <SectionHeader title={`Dogs (${breederDogs.length})`} />
            {breederDogs.map((dog) => (
              <DogListTile
                key={dog.id}
                dog={dog}
                onClick={() => navigate(`/dogs/${dog.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
