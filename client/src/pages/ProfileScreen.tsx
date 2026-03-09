import { Link } from "wouter";
import { User, Mail, Phone, MapPin, CreditCard, CalendarDays, LogOut, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AppCard } from "@/components/AppCard";
import { SectionHeader } from "@/components/SectionHeader";
import { DogListTile } from "@/components/DogListTile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { mockUserProfile, mockDogs } from "@/lib/mock-data";
import { useLocation } from "wouter";

export default function ProfileScreen() {
  const [, navigate] = useLocation();
  const user = mockUserProfile;

  const myDogs = mockDogs.filter((dog) => user.dogIds.includes(dog.id));

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusVariant = user.membershipStatus === "active"
    ? "default"
    : user.membershipStatus === "expired"
      ? "destructive"
      : "secondary";

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold" data-testid="text-page-title">Profile</h1>

        <AppCard className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate" data-testid="text-user-name">
                {user.name}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-membership-id">
                {user.membershipId}
              </p>
              <Badge variant={statusVariant} className="text-xs mt-1" data-testid="badge-membership-status">
                {user.membershipStatus.charAt(0).toUpperCase() + user.membershipStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </AppCard>

        <AppCard className="p-4">
          <h3 className="font-semibold mb-3">Member Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm truncate" data-testid="text-user-email">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm" data-testid="text-user-phone">{user.phone}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">City</p>
                <p className="text-sm" data-testid="text-user-city">{user.city}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm" data-testid="text-member-since">{user.memberSince}</p>
              </div>
            </div>
          </div>
        </AppCard>

        <div className="space-y-3">
          <SectionHeader
            title="My Dogs"
            action={{
              label: "View All",
              onClick: () => navigate("/dogs"),
            }}
          />
          {myDogs.length > 0 ? (
            myDogs.map((dog) => (
              <DogListTile
                key={dog.id}
                dog={dog}
                onClick={() => navigate(`/dogs/${dog.id}`)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-dogs">
              No dogs registered yet.
            </p>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={() => navigate("/login")}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>
    </AppLayout>
  );
}
