import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { Pedigree } from "@shared/schema";

interface PedigreeTreeProps {
  pedigree: Pedigree;
}

function AncestorCell({
  name,
  type,
  className,
}: {
  name: string;
  type: "sire" | "dam";
  className?: string;
}) {
  const [, navigate] = useLocation();
  const isUnknown = !name || name === "Unknown";

  const handleClick = () => {
    if (!isUnknown) {
      navigate(`/dogs?q=${encodeURIComponent(name)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isUnknown}
      className={cn(
        "text-left px-2 py-1.5 rounded-md border text-xs leading-tight truncate w-full transition-colors",
        type === "sire"
          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
          : "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800",
        isUnknown
          ? "opacity-50 cursor-default"
          : "cursor-pointer hover:shadow-sm active:scale-[0.98]",
        className
      )}
      data-testid={`button-ancestor-${name?.replace(/\s+/g, "-").toLowerCase() || "unknown"}`}
    >
      <span className={cn("block truncate font-medium", isUnknown && "italic text-muted-foreground")}>
        {isUnknown ? "Unknown" : name}
      </span>
      <span className={cn(
        "text-[10px] uppercase tracking-wide",
        type === "sire" ? "text-blue-500" : "text-pink-500"
      )}>
        {type === "sire" ? "♂" : "♀"}
      </span>
    </button>
  );
}

function GenerationColumn({
  label,
  ancestors,
}: {
  label: string;
  ancestors: { name: string; type: "sire" | "dam" }[];
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-wide mb-0.5">
        {label}
      </p>
      {ancestors.map((a, i) => (
        <AncestorCell key={`${label}-${i}`} name={a.name} type={a.type} />
      ))}
    </div>
  );
}

export function PedigreeTree({ pedigree }: PedigreeTreeProps) {
  const gen1Ancestors = [
    { name: pedigree.gen1.sire, type: "sire" as const },
    { name: pedigree.gen1.dam, type: "dam" as const },
  ];

  const gen2Ancestors = [
    { name: pedigree.gen2.sire_sire, type: "sire" as const },
    { name: pedigree.gen2.sire_dam, type: "dam" as const },
    { name: pedigree.gen2.dam_sire, type: "sire" as const },
    { name: pedigree.gen2.dam_dam, type: "dam" as const },
  ];

  const gen3Ancestors = [
    { name: pedigree.gen3.sire_sire_sire, type: "sire" as const },
    { name: pedigree.gen3.sire_sire_dam, type: "dam" as const },
    { name: pedigree.gen3.sire_dam_sire, type: "sire" as const },
    { name: pedigree.gen3.sire_dam_dam, type: "dam" as const },
    { name: pedigree.gen3.dam_sire_sire, type: "sire" as const },
    { name: pedigree.gen3.dam_sire_dam, type: "dam" as const },
    { name: pedigree.gen3.dam_dam_sire, type: "sire" as const },
    { name: pedigree.gen3.dam_dam_dam, type: "dam" as const },
  ];

  const gen4Ancestors = [
    { name: pedigree.gen4.sire_sire_sire_sire, type: "sire" as const },
    { name: pedigree.gen4.sire_sire_sire_dam, type: "dam" as const },
    { name: pedigree.gen4.sire_sire_dam_sire, type: "sire" as const },
    { name: pedigree.gen4.sire_sire_dam_dam, type: "dam" as const },
    { name: pedigree.gen4.sire_dam_sire_sire, type: "sire" as const },
    { name: pedigree.gen4.sire_dam_sire_dam, type: "dam" as const },
    { name: pedigree.gen4.sire_dam_dam_sire, type: "sire" as const },
    { name: pedigree.gen4.sire_dam_dam_dam, type: "dam" as const },
    { name: pedigree.gen4.dam_sire_sire_sire, type: "sire" as const },
    { name: pedigree.gen4.dam_sire_sire_dam, type: "dam" as const },
    { name: pedigree.gen4.dam_sire_dam_sire, type: "sire" as const },
    { name: pedigree.gen4.dam_sire_dam_dam, type: "dam" as const },
    { name: pedigree.gen4.dam_dam_sire_sire, type: "sire" as const },
    { name: pedigree.gen4.dam_dam_sire_dam, type: "dam" as const },
    { name: pedigree.gen4.dam_dam_dam_sire, type: "sire" as const },
    { name: pedigree.gen4.dam_dam_dam_dam, type: "dam" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-[600px]">
          <GenerationColumn label="Gen 1" ancestors={gen1Ancestors} />
          <GenerationColumn label="Gen 2" ancestors={gen2Ancestors} />
          <GenerationColumn label="Gen 3" ancestors={gen3Ancestors} />
          <GenerationColumn label="Gen 4" ancestors={gen4Ancestors} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded bg-blue-100 border border-blue-200" /> Sire (♂)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded bg-pink-100 border border-pink-200" /> Dam (♀)
        </span>
      </div>
    </div>
  );
}
