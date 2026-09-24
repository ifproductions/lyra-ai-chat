import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, MicOff, PhoneOff, Sparkles } from "lucide-react";
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
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type Phase = "intro" | "greeting" | "listening" | "thinking" | "speaking" | "idle";
type VoiceTurn = { id: string; role: "user" | "assistant"; content: string };

const GREETING = "Olá! Tudo bem com você? O que precisa que eu ajude hoje?";
const BARS = 22;

function cleanSpeech(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_`[\]()>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function CallMode({
  open,
  onClose,
  settings,
  onTranscript,
  lastResponse,
  streaming,
}: {
  open: boolean;
  onClose: () => void;
  settings: LyremSettings;
  onTranscript: (text: string) => void;
  lastResponse: string;
  streaming: boolean;
  onIntroChange?: any;

}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [turns, setTurns] = useState<VoiceTurn[]>([{ id: "greeting", role: "assistant", content: GREETING }]);
  const phaseRef = useRef<Phase>("intro");
  const mutedRef = useRef(false);
  const recRef = useRef<Rec | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sawStreaming = useRef(false);
  const responseCommitted = useRef("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const listen = useCallback(() => {
    if (!open || mutedRef.current) return go("idle");
    if (!recRef.current) return go("idle");
    setInterim("");
    go("listening");
    try { recRef.current.start(); } catch { /* Recognition is already active. */ }
  }, [go, open]);

  const speak = useCallback((text: string, then: () => void) => {
    if (!("speechSynthesis" in window)) return then();
    const utterance = new SpeechSynthesisUtterance(cleanSpeech(text).slice(0, 2500));
    utterance.lang = localeTags[settings.locale];
    utterance.onend = then;
    utterance.onerror = then;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [settings.locale]);

  useEffect(() => {
    if (!open) return;
    const browser = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (Recognition) {
      const recognition = new Recognition();
      recognition.lang = localeTags[settings.locale];
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const text = results.map((result) => result[0]?.transcript ?? "").join(" ").trim();
        setInterim(text);
        const final = results.some((result) => result.isFinal);
        if (text && final) {
          setTurns((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);
          setInterim("");
          sawStreaming.current = false;
          responseCommitted.current = "";
          go("thinking");
          onTranscript(text);
        }
      };
      recognition.onend = () => {
        if (phaseRef.current === "listening") window.setTimeout(listen, 250);
      };
      recognition.onerror = () => {
        if (phaseRef.current === "listening") go("idle");
      };
      recRef.current = recognition;
    } else {
      setSupported(false);
    }

    go("intro");
    const timer = window.setTimeout(() => {
      go("greeting");
      speak(GREETING, listen);
    }, 1200);
    navigator.mediaDevices?.getUserMedia?.({ audio: true }).then((stream) => { streamRef.current = stream; }).catch(() => {});

    return () => {
      window.clearTimeout(timer);
      phaseRef.current = "idle";
      recRef.current?.abort?.();
      recRef.current = null;
      window.speechSynthesis?.cancel();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [go, listen, onTranscript, open, settings.locale, speak]);

  useEffect(() => {
    if (!open || phaseRef.current !== "thinking") return;
    if (streaming) {
      sawStreaming.current = true;
      return;
    }
    if (sawStreaming.current && lastResponse && responseCommitted.current !== lastResponse) {
      responseCommitted.current = lastResponse;
      sawStreaming.current = false;
      setTurns((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: lastResponse }]);
      go("speaking");
      speak(lastResponse, listen);
    }
  }, [lastResponse, listen, open, speak, streaming, go]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: settings.performanceMode ? "auto" : "smooth" });
  }, [turns, interim, lastResponse, streaming, settings.performanceMode]);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    let context: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;
    const tick = (time: number) => {
      if (!analyser && streamRef.current && typeof AudioContext !== "undefined") {
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.fftSize = 64;
        context.createMediaStreamSource(streamRef.current).connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
      }
      if (analyser && data) analyser.getByteFrequencyData(data);
      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        let value = 0.12;
        if (phaseRef.current === "listening" && data && !mutedRef.current) value = Math.max(0.12, (data[index + 1] ?? 0) / 255);
        else if (phaseRef.current === "speaking" || phaseRef.current === "greeting") value = 0.28 + 0.62 * Math.abs(Math.sin(time / 170 + index * 0.58));
        else if (phaseRef.current === "thinking") value = 0.18 + 0.22 * Math.abs(Math.sin(time / 360 + index * 0.36));
        bar.style.transform = `scaleY(${value})`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); void context?.close(); };
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

  const status = !supported ? "Voz indisponível neste navegador" : muted ? "Microfone desligado" : phase === "listening" ? "A ouvir" : phase === "thinking" ? "A pensar" : phase === "speaking" || phase === "greeting" ? "Lyrem a falar" : phase === "intro" ? "A iniciar Live" : "Em pausa";
  const liveReply = phase === "thinking" && lastResponse && lastResponse !== responseCommitted.current ? lastResponse : "";

  return (
    <motion.section
      initial={{ opacity: 0, scale: 1.025, filter: "blur(18px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.985, filter: "blur(14px)" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex min-h-dvh flex-col overflow-hidden bg-background text-foreground"
      aria-label="Modo Live Lyrem AI"
    >
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-border/60 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <motion.span animate={{ scale: phase === "listening" ? [1, 1.25, 1] : 1 }} transition={{ repeat: phase === "listening" ? Infinity : 0, duration: 1.5 }} className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary"><Sparkles className="size-4" /></motion.span>
          <div><h1 className="text-sm font-semibold">Lyrem Live</h1><p className="text-xs text-muted-foreground">Conversa por voz</p></div>
        </div>
        <AnimatePresence mode="wait"><motion.p key={status} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-xs font-medium text-muted-foreground" aria-live="polite">{status}</motion.p></AnimatePresence>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end px-5 pb-44 pt-16 sm:px-10">
          <AnimatePresence>
            {phase === "intro" && (
              <motion.div initial={{ opacity: 0, scale: 0.72, filter: "blur(22px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.12, filter: "blur(18px)" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 grid place-items-center">
                <div className="text-center"><p className="text-xs font-semibold uppercase text-primary tracking-[.35em]">Lyrem AI</p><h2 className="mt-4 font-display text-5xl font-semibold sm:text-7xl">Modo Live</h2></div>
              </motion.div>
            )}
          </AnimatePresence>

          {phase !== "intro" && <div className="space-y-7">
            {turns.map((turn) => <motion.div key={turn.id} initial={{ opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className={turn.role === "user" ? "ml-auto w-fit max-w-[82%] rounded-2xl rounded-tr-sm bg-primary px-5 py-3 text-primary-foreground" : "max-w-2xl text-lg leading-relaxed sm:text-xl"}><span className="mb-2 block text-[10px] font-semibold uppercase text-muted-foreground tracking-[.2em]">{turn.role === "user" ? "Tu" : "Lyrem"}</span><p className="whitespace-pre-wrap">{cleanSpeech(turn.content)}</p></motion.div>)}
            {interim && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ml-auto w-fit max-w-[82%] rounded-2xl rounded-tr-sm border border-primary/25 bg-primary/10 px-5 py-3"><span className="mb-2 block text-[10px] font-semibold uppercase text-primary tracking-[.2em]">A transcrever</span><p className="text-base">{interim}</p></motion.div>}
            {phase === "thinking" && <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl"><span className="mb-2 block text-[10px] font-semibold uppercase text-primary tracking-[.2em]">Lyrem</span>{liveReply ? <motion.p key={liveReply.length} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="whitespace-pre-wrap text-lg leading-relaxed sm:text-xl">{cleanSpeech(liveReply)}</motion.p> : <p className="text-lg text-muted-foreground">A formular a resposta…</p>}</motion.div>}
            <div ref={bottomRef} />
          </div>}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-5 pt-12 sm:pb-8">
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 230, damping: 24 }} className="mx-auto flex h-20 w-full max-w-2xl items-center gap-4 rounded-[2rem] border border-border bg-card px-3 shadow-[0_18px_70px_color-mix(in_oklab,var(--color-primary)_22%,transparent)]">
          <Button type="button" size="icon" variant={muted ? "secondary" : "ghost"} className="size-12 shrink-0 rounded-full transition-transform hover:scale-105" onClick={toggleMute} aria-label={muted ? "Ligar microfone" : "Desligar microfone"}>{muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}</Button>
          <div className="flex h-10 min-w-0 flex-1 items-center justify-center gap-[3px]" aria-hidden>{Array.from({ length: BARS }, (_, index) => <span key={index} ref={(element) => { barsRef.current[index] = element; }} className="h-9 w-1 origin-center rounded-full bg-primary transition-transform duration-75" />)}</div>
          <Button type="button" variant="destructive" className="h-12 shrink-0 rounded-full px-5 shadow-[0_8px_30px_color-mix(in_oklab,var(--color-destructive)_32%,transparent)] transition-transform hover:scale-105" onClick={onClose}><PhoneOff className="size-5" /><span className="max-sm:sr-only">Encerrar Live</span><span className="hidden sm:inline">Encerrar</span></Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
export function LiveIntro(_props: any) {
  return null;
}
