import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SearchInput } from "@/components/SearchInput";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import { mockBreeders } from "@/lib/mock-data";
import type { Breeder } from "@shared/schema";

function BreederCard({ breeder, onClick }: { breeder: Breeder; onClick: () => void }) {
  const initials = breeder.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppCard hoverable className="p-4" onClick={onClick} data-testid={`card-breeder-${breeder.id}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={breeder.imageUrl} alt={breeder.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate" data-testid={`text-breeder-name-${breeder.id}`}>
                {breeder.name}
              </p>
              <p className="text-sm text-primary font-medium truncate">{breeder.kennelName}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {breeder.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Since {breeder.activeSince}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {breeder.totalDogs} dogs
            </span>
          </div>
        </div>
      </div>
    </AppCard>
  );
}

export default function BreederDirectoryScreen() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const filtered = mockBreeders.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.kennelName.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-6">
        <h1 className="text-xl font-bold" data-testid="text-breeder-directory-title">Breeder Directory</h1>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search breeders..."
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No breeders found"
            description="Try adjusting your search terms."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((breeder) => (
              <BreederCard
                key={breeder.id}
                breeder={breeder}
                onClick={() => navigate(`/breeders/${breeder.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
