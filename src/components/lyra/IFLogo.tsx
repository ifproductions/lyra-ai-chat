import { cn } from "@/lib/utils";

/** IF Productions mark: dark rounded square with gradient "I" and "F". */
export function IFLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[28%] border border-border bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-background)_85%,black),color-mix(in_oklab,var(--color-primary)_14%,var(--color-background)))]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" className="size-[58%]" role="presentation">
        <defs>
          <linearGradient id="if-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 320)" />
            <stop offset="55%" stopColor="oklch(0.62 0.24 302)" />
            <stop offset="100%" stopColor="oklch(0.7 0.2 268)" />
          </linearGradient>
        </defs>
        <rect x="4" y="6" width="7" height="36" rx="3.5" fill="url(#if-grad)" />
        <rect x="18" y="6" width="7" height="36" rx="3.5" fill="url(#if-grad)" />
        <rect x="18" y="6" width="26" height="7" rx="3.5" fill="url(#if-grad)" />
        <rect x="18" y="20" width="19" height="7" rx="3.5" fill="url(#if-grad)" />
      </svg>
    </span>
  );
}

/** Decorative IF Productions stripe accent (as on the brand banner). */
export function IFStripes({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)} aria-hidden>
      <span className="h-1.5 w-6 rounded-full bg-primary/70" />
      <span className="h-1.5 w-4 rounded-full bg-foreground/60" />
      <span className="h-1.5 w-6 rounded-full bg-primary" />
      <span className="h-1.5 w-4 rounded-full bg-muted-foreground/60" />
    </span>
  );
}
