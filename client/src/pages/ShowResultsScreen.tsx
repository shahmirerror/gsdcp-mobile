import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, MapPin, Award } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockShowEvents, mockShowResults } from "@/lib/mock-data";
import { EmptyState } from "@/components/EmptyState";

export default function ShowResultsScreen() {
  const params = useParams<{ id: string }>();
  const showId = params.id;

  const show = mockShowEvents.find((s) => s.id === showId);
  const results = mockShowResults
    .filter((r) => r.showEventId === showId)
    .sort((a, b) => a.placement - b.placement);

  const classesList = Array.from(new Set(results.map((r) => r.className)));

  if (!show) {
    return (
      <AppLayout>
        <div className="p-4">
          <Link href="/shows">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <EmptyState
            icon={Award}
            title="Show Not Found"
            description="The show event you're looking for doesn't exist."
          />
        </div>
      </AppLayout>
    );
  }

  const formattedDate = new Date(show.date).toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/shows">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold truncate" data-testid="text-show-title">
            {show.name}
          </h1>
        </div>

        <AppCard className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={show.status === "completed" ? "secondary" : "default"}
              >
                {show.status === "completed" ? "Completed" : "Upcoming"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {show.entryCount} entries
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{show.description}</p>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span data-testid="text-result-date">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span data-testid="text-result-location">{show.location}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Judge: <span className="font-medium">{show.judge}</span>
            </p>
          </div>
        </AppCard>

        {results.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Results Yet"
            description="Results for this show have not been published yet."
          />
        ) : (
          classesList.map((cls) => {
            const classResults = results.filter((r) => r.className === cls);
            return (
              <div key={cls} className="space-y-2">
                <h2 className="font-semibold text-base" data-testid={`text-class-${cls.toLowerCase().replace(/\s+/g, "-")}`}>
                  {cls}
                </h2>
                <AppCard className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Dog</TableHead>
                        <TableHead>Handler</TableHead>
                        <TableHead>Award</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classResults.map((result) => (
                        <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                          <TableCell className="font-semibold" data-testid={`text-placement-${result.id}`}>
                            {result.placement}
                          </TableCell>
                          <TableCell>
                            <Link href={`/dogs/${result.dogId}`}>
                              <span className="text-primary font-medium cursor-pointer" data-testid={`link-dog-${result.dogId}`}>
                                {result.dogName}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {result.handler}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {result.award}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AppCard>
              </div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
