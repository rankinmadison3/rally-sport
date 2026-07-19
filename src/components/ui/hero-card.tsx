import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Shared crimson gradient hero card used at the top of primary pages.
 * Matches the Dashboard's visual language (rounded-3xl, radial glow overlay,
 * primary-foreground text, subtle inner grid).
 */
export const HeroCard = ({
  eyebrow,
  title,
  subtitle,
  icon,
  right,
  children,
  className,
}: HeroCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 sm:p-6 text-primary-foreground animate-fade-in shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.45)]",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.82) 100%)",
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "hsl(var(--primary-foreground) / 0.35)" }}
      />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70 mb-1.5">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold font-display leading-tight truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-primary-foreground/80 mt-2 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="shrink-0 relative">{right}</div>}
      </div>

      {children && <div className="relative mt-5">{children}</div>}
    </div>
  );
};

interface StatTileProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string; // tailwind bg class for icon bubble
  onClick?: () => void;
}

export const StatTile = ({ icon, label, value, hint, accent, onClick }: StatTileProps) => {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] text-left w-full transition-transform",
        onClick && "hover:-translate-y-0.5 active:translate-y-0"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              accent ?? "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold font-display text-card-foreground leading-none">
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </Comp>
  );
};
