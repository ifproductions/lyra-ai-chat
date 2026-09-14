import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Maximize2, Pause, Play, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { randomSeed } from "@/lib/lyrem-image";
import { VIDEO_FRAME_COUNT, videoFrameUrls } from "@/lib/lyrem-video";

export function ChatVideo({ prompt, alt }: { prompt: string; alt?: string | undefined }) {
  const [seed, setSeed] = useState(() => randomSeed());
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [zoom, setZoom] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frames = useMemo(() => videoFrameUrls(prompt, seed), [prompt, seed]);
  const loaded = ready >= VIDEO_FRAME_COUNT;

  useEffect(() => {
    setReady(0);
    setFrame(0);
  }, [seed]);

  useEffect(() => {
    if (!playing || !loaded) return;
    timerRef.current = setInterval(() => {
      setFrame((f) => (f + 1) % VIDEO_FRAME_COUNT);
    }, 420);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, loaded]);

  async function download() {
    const url = frames[frame]!;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `lyrem-video-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(url, "_blank", "noreferrer");
    }
  }

  return (
    <div className="my-3 w-full max-w-xl">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-primary/35 bg-card shadow-[0_18px_60px_-24px_color-mix(in_oklab,var(--color-primary)_65%,transparent)]">
        {frames.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={alt || `Vídeo gerado pela Lyrem AI — cena ${i + 1}`}
            onLoad={() => setReady((r) => r + 1)}
            onError={() => setReady((r) => r + 1)}
            className="absolute inset-0 size-full object-cover transition-opacity duration-200"
            style={{ opacity: loaded && i === frame ? 1 : 0 }}
          />
        ))}

        {!loaded && (
          <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(110deg,var(--color-card),color-mix(in_oklab,var(--color-primary)_18%,var(--color-card)),var(--color-card))] text-sm text-muted-foreground">
            A preparar o vídeo… {ready}/{VIDEO_FRAME_COUNT}
          </div>
        )}

        {loaded && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
            className="absolute inset-0 grid place-items-center opacity-0 transition-opacity hover:opacity-100"
          >
            <span className="grid size-14 place-items-center rounded-full bg-background/70 text-primary backdrop-blur">
              {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
            </span>
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pausar" : "Reproduzir"}
        </Button>
        <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => setZoom(true)}>
          <Maximize2 className="size-4" /> Ampliar
        </Button>
        <Button variant="secondary" size="sm" className="rounded-xl" onClick={download}>
          <Download className="size-4" /> Baixar cena
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl"
          onClick={() => setSeed(randomSeed())}
        >
          <RefreshCw className="size-4" /> Regenerar
        </Button>
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-5xl border-primary/30 bg-card/95 p-3">
          <DialogTitle className="sr-only">{alt || "Vídeo gerado pela Lyrem AI"}</DialogTitle>
          <img
            src={frames[frame]}
            alt={alt || "Vídeo gerado pela Lyrem AI"}
            className="max-h-[80vh] w-full rounded-xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
