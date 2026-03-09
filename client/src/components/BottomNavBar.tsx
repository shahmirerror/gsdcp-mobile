import { useLocation, Link } from "wouter";
import { Home, Search, Users, Trophy, User } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Search,
  Users,
  Trophy,
  User,
};

export function BottomNavBar() {
  const [location] = useLocation();

  return (
    <nav
      className="border-t bg-card flex items-stretch shrink-0"
      data-testid="bottom-nav"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive =
          item.path === "/"
            ? location === "/"
            : location.startsWith(item.path);

        return (
          <Link key={item.path} href={item.path} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
