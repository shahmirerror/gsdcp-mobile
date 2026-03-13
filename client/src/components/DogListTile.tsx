import type { Dog } from "@shared/schema";
import { AppCard } from "@/components/AppCard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DogListTileProps {
  dog: Dog;
  onClick?: () => void;
  className?: string;
}

export function DogListTile({ dog, onClick, className }: DogListTileProps) {
  const initials = dog.dog_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppCard
      hoverable
      className={cn("p-3", className)}
      onClick={onClick}
      data-testid={`card-dog-${dog.id}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={dog.imageUrl} alt={dog.dog_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" data-testid={`text-dog-name-${dog.id}`}>
            {dog.dog_name}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {dog.KP}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {dog.sex}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {dog.color}
            </Badge>
          </div>
        </div>
        {dog.titles.length > 0 && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            {dog.titles.slice(0, 2).map((title) => (
              <Badge key={title} variant="default" className="text-xs">
                {title}
              </Badge>
            ))}
            {dog.titles.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{dog.titles.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </AppCard>
  );
}
