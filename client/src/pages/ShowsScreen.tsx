import { useState } from "react";
import { Link } from "wouter";
import { Calendar, MapPin, Users, ChevronRight, Trophy } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockShowEvents } from "@/lib/mock-data";
import type { ShowEvent } from "@shared/schema";

function ShowEventCard({ show }: { show: ShowEvent }) {
  const formattedDate = new Date(show.date).toLocaleDateString("en-PK", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const statusVariant = show.status === "upcoming"
    ? "default"
    : show.status === "completed"
      ? "secondary"
      : "outline";

  const statusLabel = show.status === "upcoming"
    ? "Upcoming"
    : show.status === "completed"
      ? "Completed"
      : "Ongoing";

  return (
    <Link href={`/shows/${show.id}`}>
      <AppCard
        hoverable
        className="p-4"
        data-testid={`card-show-${show.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate" data-testid={`text-show-name-${show.id}`}>
                {show.name}
              </h3>
              <Badge variant={statusVariant} className="text-xs shrink-0">
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {show.description}
            </p>
            <div className="flex flex-col gap-1 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span data-testid={`text-show-date-${show.id}`}>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate" data-testid={`text-show-location-${show.id}`}>{show.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{show.entryCount} entries</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Judge: <span className="font-medium">{show.judge}</span>
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </AppCard>
    </Link>
  );
}

export default function ShowsScreen() {
  const [tab, setTab] = useState("upcoming");

  const upcomingShows = mockShowEvents.filter((s) => s.status === "upcoming");
  const completedShows = mockShowEvents.filter((s) => s.status === "completed");

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold" data-testid="text-page-title">Shows</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="upcoming" className="flex-1" data-testid="tab-upcoming">
              Upcoming ({upcomingShows.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1" data-testid="tab-completed">
              Completed ({completedShows.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcomingShows.length > 0 ? (
              upcomingShows.map((show) => (
                <ShowEventCard key={show.id} show={show} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-upcoming">
                No upcoming shows scheduled.
              </p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completedShows.length > 0 ? (
              completedShows.map((show) => (
                <ShowEventCard key={show.id} show={show} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-completed">
                No completed shows yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
