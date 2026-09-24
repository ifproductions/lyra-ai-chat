import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localeTags } from "@/lib/lyrem-i18n";
import type { LyremSettings } from "@/lib/lyrem-store";

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type Phase = "intro" | "greeting" | "listening" | "thinking" | "speaking" | "idle";

const GREETING = "Olá! Tudo bem com você? O que precisa que eu ajude hoje?";
const BARS = 14;

/** Full-screen "Modo Live" intro text. Rendered alongside the capsule. */
export function LiveIntro({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="live-intro"
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(16px)" }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="absolute size-[28rem] rounded-full bg-primary/25 blur-3xl"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.1, 1], opacity: [0, 0.9, 0.6] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <motion.h2
            className="relative font-display text-6xl font-bold tracking-tight text-primary drop-shadow-[0_0_40px_color-mix(in_oklab,var(--color-primary)_70%,transparent)] sm:text-8xl"
            initial={{ scale: 0.6, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: [0.6, 1.08, 1], opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            Modo Live
          </motion.h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CallMode({
  open,
  onClose,
  settings,
  onTranscript,
  lastResponse,
  streaming,
  onIntroChange,
}: {
  open: boolean;
  onClose: () => void;
  settings: LyremSettings;
  onTranscript: (text: string) => void;
  lastResponse: string;
  streaming: boolean;
  onIntroChange?: (v: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(true);
  const phaseRef = useRef<Phase>("intro");
  const mutedRef = useRef(false);
  const recRef = useRef<Rec | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sawStreaming = useRef(false);

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const listen = useCallback(() => {
    if (!open) return;
    if (mutedRef.current) return go("idle");
    const r = recRef.current;
    if (!r) return go("idle");
    go("listening");
    try {
      r.start();
    } catch {
      /* already started */
    }
  }, [go, open]);

  const speak = useCallback(
    (text: string, then: () => void) => {
      if (!("speechSynthesis" in window)) return then();
      const u = new SpeechSynthesisUtterance(text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/[#*_`[\]()>]/g, " ").slice(0, 2500));
      u.lang = localeTags[settings.locale];
      u.onend = then;
      u.onerror = then;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [settings.locale],
  );

  // Setup recognition + intro/greeting sequence
  useEffect(() => {
    if (!open) return;
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (C) {
      const r = new C();
      r.lang = localeTags[settings.locale];
      r.interimResults = false;
      r.continuous = false;
      r.onresult = (e) => {
        const text = e.results[0]?.[0]?.transcript?.trim();
        if (text) {
          sawStreaming.current = false;
          go("thinking");
          onTranscript(text);
        }
      };
      r.onend = () => {
        if (phaseRef.current === "listening") setTimeout(() => phaseRef.current === "listening" && listen(), 250);
      };
      r.onerror = () => {
        if (phaseRef.current === "listening") go("idle");
      };
      recRef.current = r;
    } else setSupported(false);

    go("intro");
    onIntroChange?.(true);
    const timer = setTimeout(() => {
      onIntroChange?.(false);
      go("greeting");
      speak(GREETING, () => listen());
    }, 1500);

    navigator.mediaDevices?.getUserMedia?.({ audio: true }).then((s) => (streamRef.current = s)).catch(() => {});

    return () => {
      clearTimeout(timer);
      onIntroChange?.(false);
      phaseRef.current = "idle";
      recRef.current?.abort?.();
      recRef.current = null;
      window.speechSynthesis?.cancel();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Speak the reply once streaming finishes
  useEffect(() => {
    if (!open || phaseRef.current !== "thinking") return;
    if (streaming) {
      sawStreaming.current = true;
      return;
    }
    if (sawStreaming.current && lastResponse) {
      sawStreaming.current = false;
      go("speaking");
      speak(lastResponse, () => listen());
    }
  }, [streaming, lastResponse, open, go, speak, listen]);

  // Reactive waveform
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;
    const tick = (t: number) => {
      const p = phaseRef.current;
      if (!analyser && streamRef.current && typeof AudioContext !== "undefined") {
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        ctx.createMediaStreamSource(streamRef.current).connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
      }
      if (analyser && data) analyser.getByteFrequencyData(data);
      barsRef.current.forEach((el, i) => {
        if (!el) return;
        let v = 0.15;
        if (p === "listening" && data && !mutedRef.current) v = Math.max(0.12, (data[i + 1] ?? 0) / 255);
        else if (p === "speaking" || p === "greeting") v = 0.3 + 0.5 * Math.abs(Math.sin(t / 180 + i * 0.7));
        else if (p === "thinking") v = 0.2 + 0.15 * Math.abs(Math.sin(t / 400 + i * 0.4));
        el.style.transform = `scaleY(${v})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      void ctx?.close();
    };
  }, [open]);

  const toggleMute = () => {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      recRef.current?.abort?.();
      if (phaseRef.current === "listening") go("idle");
    } else if (phaseRef.current === "idle") listen();
  };

  const status = !supported
    ? "Voz indisponível neste navegador"
    : muted
      ? "Microfone desligado"
      : phase === "listening"
        ? "A ouvir…"
        : phase === "thinking"
          ? "Lyrem a pensar…"
          : phase === "speaking" || phase === "greeting"
            ? "Lyrem a falar…"
            : phase === "intro"
              ? "A ligar…"
              : "Em pausa";

  return (
    <motion.div
      layoutId="composer"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-full border border-primary/30 bg-card/60 p-2 shadow-[0_0_40px_color-mix(in_oklab,var(--color-primary)_25%,transparent)] backdrop-blur-2xl"
    >
      <Button
        type="button"
        size="icon"
        variant={muted ? "secondary" : "ghost"}
        className="size-11 shrink-0 rounded-full"
        onClick={toggleMute}
        aria-label={muted ? "Ligar microfone" : "Desligar microfone"}
      >
        {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </Button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <div className="flex h-8 items-center gap-[3px]" aria-hidden>
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                barsRef.current[i] = el;
              }}
              className="h-8 w-1 origin-center rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-transform duration-75"
              style={{ transform: "scaleY(.15)" }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            className="truncate text-sm font-medium"
            aria-live="polite"
          >
            {status}
          </motion.span>
        </AnimatePresence>
      </div>
      <Button
        type="button"
        variant="destructive"
        className="h-11 shrink-0 rounded-full px-4 shadow-[0_0_24px_color-mix(in_oklab,var(--color-destructive)_55%,transparent)]"
        onClick={onClose}
      >
        <PhoneOff className="size-4" />
        <span className="max-sm:sr-only">Encerrar Live</span>
      </Button>
    </motion.div>
  );
}
