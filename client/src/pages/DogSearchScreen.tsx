import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Dog as DogIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { SearchInput } from "@/components/SearchInput";
import { DogListTile } from "@/components/DogListTile";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Dog } from "@shared/schema";

const genderFilters = ["All", "Male", "Female"] as const;
type GenderFilter = (typeof genderFilters)[number];

export default function DogSearchScreen() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialQuery = params.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");

  const { data: dogsResponse, isLoading, isError } = useQuery<{ success: boolean; data: Dog[] }>({
    queryKey: ["/api/dogs"],
  });

  const dogs = dogsResponse?.data ?? [];

  const filteredDogs = useMemo(() => {
    let results = dogs;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (dog) =>
          dog.dog_name.toLowerCase().includes(q) ||
          (dog.KP && dog.KP.toLowerCase().includes(q)) ||
          (dog.owner && dog.owner.toLowerCase().includes(q)) ||
          (dog.breeder && dog.breeder.toLowerCase().includes(q)) ||
          (dog.color && dog.color.toLowerCase().includes(q)) ||
          dog.titles.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (genderFilter !== "All") {
      results = results.filter((dog) => dog.sex === genderFilter);
    }

    return results;
  }, [dogs, searchQuery, genderFilter]);

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold" data-testid="text-dog-search-title">
          Dog Search
        </h1>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, KP, owner..."
        />

        <div className="flex items-center gap-2 flex-wrap">
          {genderFilters.map((filter) => (
            <Badge
              key={filter}
              variant={genderFilter === filter ? "default" : "secondary"}
              className={cn(
                "cursor-pointer",
                genderFilter === filter && "bg-primary"
              )}
              onClick={() => setGenderFilter(filter)}
              data-testid={`filter-gender-${filter.toLowerCase()}`}
            >
              {filter}
            </Badge>
          ))}
          <span className="text-sm text-muted-foreground ml-auto" data-testid="text-dog-count">
            {filteredDogs.length} {filteredDogs.length === 1 ? "dog" : "dogs"}
          </span>
        </div>

        {isError ? (
          <EmptyState
            icon={DogIcon}
            title="Failed to load dogs"
            description="Could not connect to the server. Please try again later."
          />
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredDogs.length > 0 ? (
          <div className="space-y-2">
            {filteredDogs.map((dog) => (
              <DogListTile
                key={dog.id}
                dog={dog}
                onClick={() => navigate(`/dogs/${dog.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={DogIcon}
            title="No dogs found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        )}
      </div>
    </AppLayout>
  );
}
