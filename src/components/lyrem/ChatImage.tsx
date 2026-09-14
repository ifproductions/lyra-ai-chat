import { useEffect, useState } from "react";
import { Download, Maximize2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { pollinationsUrl, promptFromUrl, randomSeed } from "@/lib/lyra-image";
import { cn } from "@/lib/utils";

export function ChatImage({ src, alt }: { src: string; alt?: string | undefined }) {
  const [url, setUrl] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setUrl(src);
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const basePrompt = promptFromUrl(url);

  function regenerate() {
    if (!basePrompt) return;
    setLoaded(false);
    setFailed(false);
    setUrl(pollinationsUrl(basePrompt, randomSeed()));
  }

  async function download() {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `lyra-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(url, "_blank", "noreferrer");
    }
  }

  return (
    <div className="my-3 w-full max-w-md">
      <div className="relative overflow-hidden rounded-2xl border border-primary/35 bg-card shadow-[0_18px_60px_-24px_color-mix(in_oklab,var(--color-primary)_65%,transparent)]">
        {!loaded && !failed && (
          <div className="aspect-square w-full animate-pulse bg-[linear-gradient(110deg,var(--color-card),color-mix(in_oklab,var(--color-primary)_18%,var(--color-card)),var(--color-card))]" />
        )}
        {failed ? (
          <div className="grid aspect-square w-full place-items-center px-6 text-center text-sm text-muted-foreground">
            Não consegui carregar esta imagem. Tenta regenerar.
          </div>
        ) : (
          <img
            src={url}
            alt={alt || "Imagem gerada pela Lyra AI"}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            onClick={() => setZoom(true)}
            className={cn(
              "w-full cursor-zoom-in transition-opacity duration-500",
              loaded ? "opacity-100" : "absolute inset-0 opacity-0",
            )}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => setZoom(true)}>
          <Maximize2 className="size-4" /> Ampliar
        </Button>
        <Button variant="secondary" size="sm" className="rounded-xl" onClick={download}>
          <Download className="size-4" /> Baixar
        </Button>
        {basePrompt && (
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={regenerate}>
            <RefreshCw className="size-4" /> Regenerar
          </Button>
        )}
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-4xl border-primary/30 bg-card/95 p-3">
          <DialogTitle className="sr-only">{alt || "Imagem gerada pela Lyra AI"}</DialogTitle>
          <img
            src={url}
            alt={alt || "Imagem gerada pela Lyra AI"}
            className="max-h-[80vh] w-full rounded-xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
