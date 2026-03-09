import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonProps {
  fullWidth?: boolean;
}

export function PrimaryButton({ className, fullWidth, children, ...props }: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
