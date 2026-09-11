import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  CalendarDays,
  Clapperboard,
  Code2,
  Megaphone,
  Settings,
  Sparkle,
  Square,
} from "lucide-react";

import { IFLogo, IFStripes } from "@/components/lyra/IFLogo";
import { Markdown } from "@/components/lyra/Markdown";
import { SettingsDialog } from "@/components/lyra/SettingsDialog";
import { Sidebar } from "@/components/lyra/Sidebar";

import { Button } from "@/components/ui/button";
import { detectImagePrompt, pollinationsUrl } from "@/lib/lyra-image";
import { streamDemo, streamOpenRouter } from "@/lib/lyra-client";

import {
  DEFAULT_MODEL,
  loadConversations,
  loadSettings,
  newId,
  saveConversations,
  saveSettings,
  titleFrom,
  type ChatMessage,
  type Conversation,
  type LyraSettings,
} from "@/lib/lyra-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IF AI — Lyra, a assistente da IF Productions" },
      {
        name: "description",
        content:
          "Converse com a Lyra AI, a assistente da IF Productions. Chat moderno com streaming, Markdown e modelos da OpenRouter à sua escolha.",
      },
      { property: "og:title", content: "IF AI — Lyra, a assistente da IF Productions" },
      {
        property: "og:description",
        content:
          "Chat inteligente com a Lyra AI: respostas em streaming, código formatado e escolha de modelo. O Mundo Precisa de ti.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LyraChat,
});

const SUGGESTIONS = [
  {
    icon: Megaphone,
    title: "Escreve um argumento curto para um anúncio da IF Productions",
    prompt: "Escreve um argumento curto e criativo para um anúncio da IF Productions.",
  },
  {
    icon: Clapperboard,
    title: "Explica streaming de vídeo de forma simples",
    prompt: "Explica-me streaming de vídeo como se eu tivesse 12 anos.",
  },
  {
    icon: CalendarDays,
    title: "Cria um plano de conteúdos para 7 dias no Instagram",
    prompt: "Cria um plano de conteúdos para 7 dias no Instagram de um estúdio criativo.",
  },
  {
    icon: Code2,
    title: "Dá-me um exemplo de código React com animação",
    prompt: "Dá-me um exemplo de código React com uma animação simples e elegante.",
  },
];


function LyraChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<LyraSettings>({ apiKey: "", model: DEFAULT_MODEL });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setConversations(loadConversations());
    setSidebarOpen(window.innerWidth >= 768);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages = active?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streaming, active?.messages[active.messages.length - 1]?.content]);

  const autoSize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const appendToLast = useCallback((conversationId: string, chunk: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== conversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m, i) =>
                i === c.messages.length - 1 ? { ...m, content: m.content + chunk } : m,
              ),
            },
      ),
    );
  }, []);

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || streaming) return;

    setError(null);
    setInput("");
    requestAnimationFrame(autoSize);

    const userMessage: ChatMessage = { id: newId(), role: "user", content: prompt };
    const assistantMessage: ChatMessage = { id: newId(), role: "assistant", content: "" };

    let conversationId = activeId;
    let history: ChatMessage[] = [];

    if (!conversationId || !conversations.some((c) => c.id === conversationId)) {
      conversationId = newId();
      const created: Conversation = {
        id: conversationId,
        title: titleFrom(prompt),
        createdAt: Date.now(),
        messages: [userMessage, assistantMessage],
      };
      history = [userMessage];
      setConversations((prev) => [created, ...prev]);
      setActiveId(conversationId);
    } else {
      const current = conversations.find((c) => c.id === conversationId)!;
      history = [...current.messages, userMessage];
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                title: c.messages.length === 0 ? titleFrom(prompt) : c.title,
                messages: [...c.messages, userMessage, assistantMessage],
              }
            : c,
        ),
      );
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      const onDelta = (chunk: string) => appendToLast(conversationId!, chunk);
      const imagePrompt = detectImagePrompt(prompt);
      if (imagePrompt) {
        const url = pollinationsUrl(imagePrompt);
        const reply = `Claro! Aqui está a tua imagem de **${imagePrompt}** 💜\n\n![${imagePrompt}](${url})\n\nSe quiseres outra versão, toca em **Regenerar**.`;
        for (const token of reply.split(/(\s+)/)) {
          if (controller.signal.aborted) break;
          onDelta(token);
          await new Promise((r) => setTimeout(r, 8));
        }
      } else if (settings.apiKey) {

        await streamOpenRouter({
          apiKey: settings.apiKey,
          model: settings.model || DEFAULT_MODEL,
          messages: history,
          signal: controller.signal,
          onDelta,
        });
      } else {
        await streamDemo({ messages: history, signal: controller.signal, onDelta });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Não foi possível obter a resposta.");
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  function newChat() {
    stop();
    setActiveId(null);
    setInput("");
    setError(null);
  }

  function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          stop();
          setActiveId(id);
        }}
        onDelete={deleteConversation}
        onNewChat={newChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col max-md:pl-[60px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent)]"
        />

        <header className="relative z-10 flex items-center justify-between border-b border-border/70 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">
              IF <span className="text-primary">AI</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground">O Mundo Precisa de ti</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground sm:inline">
              {settings.apiKey ? settings.model || DEFAULT_MODEL : "modo demonstração"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir configurações"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-5" />
            </Button>
          </div>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-5 pb-56 pt-8">
            {empty ? (
              <div className="flex flex-col items-center pt-10 text-center">
                <IFStripes className="mb-6" />
                <IFLogo className="size-16 glow-purple" />
                <h2 className="mt-7 bg-[linear-gradient(100deg,var(--color-foreground),color-mix(in_oklab,var(--color-primary)_65%,var(--color-foreground)))] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  Olá, como posso ajudar?
                </h2>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  Sou a Lyra, a assistente da IF Productions. Escolhe uma sugestão ou escreve
                  a tua pergunta.
                </p>
                <div className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
                    <button
                      key={title}
                      onClick={() => send(prompt)}
                      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                      <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                        <Icon className="size-4.5" />
                      </span>
                      <span className="text-sm font-medium leading-snug text-foreground/90">
                        {title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            ) : (
              <div className="space-y-7">
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1;
                  return m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-3 text-[15px] text-primary-foreground">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-3">
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/35">
                        <Sparkle className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Lyra AI</p>
                        {m.content ? (
                          <Markdown content={m.content} />
                        ) : (
                          <span className="inline-flex gap-1 py-2">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="size-2 animate-bounce rounded-full bg-primary/70"
                                style={{ animationDelay: `${d * 120}ms` }}
                              />
                            ))}
                          </span>
                        )}
                        {isLast && streaming && m.content && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-10">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl px-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className={cn(
                "glow-purple flex items-end gap-2 rounded-3xl border border-border bg-card/95 p-2 pl-4 backdrop-blur transition-colors focus-within:border-primary/60",
              )}
            >
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoSize();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Fala com a Lyra..."
                className="max-h-[200px] flex-1 resize-none bg-transparent py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              {streaming ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={stop}
                  aria-label="Parar resposta"
                  className="size-10 shrink-0 rounded-2xl"
                >
                  <Square className="size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  aria-label="Enviar mensagem"
                  className="size-10 shrink-0 rounded-2xl"
                >
                  <ArrowUp className="size-5" />
                </Button>
              )}
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              A Lyra é uma IA e pode cometer erros.
            </p>
          </div>
        </div>
      </main>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={(s) => {
          setSettings(s);
          saveSettings(s);
        }}
      />
    </div>
  );
}
