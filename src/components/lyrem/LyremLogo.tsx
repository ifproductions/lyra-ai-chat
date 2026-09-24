import logo from "@/assets/lyrem-ai-logo.png.asset.json";
import lightLogo from "@/assets/lyrem-ai-logo-light.png.asset.json";
import { cn } from "@/lib/utils";

export function LyremLogo({ className, alt = "Lyrem AI" }: { className?: string; alt?: string }) {
  return <img src={logo.url} alt={alt} className={cn("shrink-0 object-contain", className)} />;
}

/** Hero logo: rectangular light artwork in light mode, dark rounded artwork in dark mode. */
export function LyremHeroLogo() {
  return (
    <>
      <img
        src={lightLogo.url}
        alt="Lyrem AI"
        className="h-40 w-56 rounded-3xl border border-primary/15 bg-card object-cover shadow-[0_18px_50px_color-mix(in_oklab,var(--color-primary)_22%,transparent)] dark:hidden sm:h-48 sm:w-72"
      />
      <div className="hidden overflow-hidden rounded-[2rem] border border-primary/25 bg-background/70 p-1.5 shadow-[0_0_48px_color-mix(in_oklab,var(--color-primary)_32%,transparent)] backdrop-blur-xl dark:block">
        <img src={logo.url} alt="Lyrem AI" className="size-32 rounded-[1.65rem] object-contain sm:size-40" />
      </div>
    </>
  );
}
