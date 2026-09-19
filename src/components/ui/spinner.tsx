import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<SpinnerSize, { wrapper: string; ring: string; gap: string; text: string }> = {
  xs: { wrapper: "w-3 h-3",   ring: "border-[1.5px]", gap: "",      text: "text-xs" },
  sm: { wrapper: "w-4 h-4",   ring: "border-2",       gap: "gap-2", text: "text-sm" },
  md: { wrapper: "w-5 h-5",   ring: "border-2",       gap: "gap-3", text: "text-sm" },
  lg: { wrapper: "w-7 h-7",   ring: "border-[3px]",   gap: "gap-3", text: "text-base" },
};

export function Spinner({
  size = "md",
  label,
  className,
}: {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <span
        className={cn(
          s.wrapper,
          s.ring,
          "rounded-full border-purple-500 border-t-transparent animate-spin flex-shrink-0"
        )}
        aria-hidden="true"
      />
      {label && (
        <span className={cn("text-muted-foreground", s.text)}>{label}</span>
      )}
    </div>
  );
}
