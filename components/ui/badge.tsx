import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "blue"
  | "purple"
  | "teal"
  | "orange"
  | "amber"
  | "sky"
  | "red"
  | "gray";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-purple-500/15 text-purple-400",
  teal: "bg-teal-500/15 text-teal-400",
  orange: "bg-orange-500/15 text-orange-400",
  amber: "bg-amber-500/15 text-amber-400",
  sky: "bg-sky-500/15 text-sky-400",
  red: "bg-red-500/15 text-red-400",
  gray: "bg-muted text-muted-foreground",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
