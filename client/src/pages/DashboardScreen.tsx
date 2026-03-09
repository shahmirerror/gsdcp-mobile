import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Users, Trophy, Calendar, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SearchInput } from "@/components/SearchInput";
import { DogListTile } from "@/components/DogListTile";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { mockDogs, mockShowResults, mockShowEvents } from "@/lib/mock-data";

const quickActions = [
  { label: "Search Dogs", icon: Search, path: "/dogs" },
  { label: "Breeders", icon: Users, path: "/breeders" },
  { label: "Shows", icon: Trophy, path: "/shows" },
  { label: "Calendar", icon: Calendar, path: "/shows" },
];

export default function DashboardScreen() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const recentResults = mockShowResults.slice(0, 4);
  const upcomingShows = mockShowEvents.filter((s) => s.status === "upcoming").slice(0, 2);
  const featuredDogs = mockDogs.slice(0, 3);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      navigate(`/dogs?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
            {APP_CONFIG.appFullName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-dashboard-subtitle">
            Welcome back to {APP_CONFIG.appName}
          </p>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search dogs, breeders, shows..."
        />

        <div>
          <SectionHeader title="Quick Actions" className="mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <AppCard
                key={action.label}
                hoverable
                className="p-3 flex flex-col items-center gap-1.5 text-center"
                onClick={() => navigate(action.path)}
                data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="rounded-md bg-primary/10 p-2">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </AppCard>
            ))}
          </div>
        </div>

        {upcomingShows.length > 0 && (
          <div>
            <SectionHeader
              title="Upcoming Shows"
              action={{ label: "View All", onClick: () => navigate("/shows") }}
              className="mb-3"
            />
            <div className="space-y-2">
              {upcomingShows.map((show) => (
                <AppCard
                  key={show.id}
                  hoverable
                  className="p-3"
                  onClick={() => navigate(`/shows/${show.id}`)}
                  data-testid={`card-show-${show.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate" data-testid={`text-show-name-${show.id}`}>
                        {show.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date(show.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{show.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {show.entryCount} entries
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionHeader
            title="Featured Dogs"
            action={{ label: "See All", onClick: () => navigate("/dogs") }}
            className="mb-3"
          />
          <div className="space-y-2">
            {featuredDogs.map((dog) => (
              <DogListTile
                key={dog.id}
                dog={dog}
                onClick={() => navigate(`/dogs/${dog.id}`)}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            title="Recent Results"
            action={{ label: "View All", onClick: () => navigate("/shows") }}
            className="mb-3"
          />
          <div className="space-y-2">
            {recentResults.map((result) => (
              <AppCard
                key={result.id}
                hoverable
                className="p-3"
                onClick={() => navigate(`/dogs/${result.dogId}`)}
                data-testid={`card-result-${result.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate" data-testid={`text-result-dog-${result.id}`}>
                      {result.dogName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.showName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.className}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="default" className="text-xs">
                      #{result.placement}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{result.award}</span>
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
