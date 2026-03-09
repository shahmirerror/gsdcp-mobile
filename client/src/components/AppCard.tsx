import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function AppCard({ className, hoverable, children, ...props }: AppCardProps) {
  return (
    <Card
      className={cn(
        "overflow-visible",
        hoverable && "hover-elevate cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
