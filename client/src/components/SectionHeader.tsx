import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <h2 className="text-lg font-semibold" data-testid={`text-section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        {title}
      </h2>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-primary"
          data-testid={`link-${title.toLowerCase().replace(/\s+/g, "-")}-action`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
