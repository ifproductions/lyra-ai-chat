import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { LyremLogo } from "@/components/lyrem/LyremLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "login" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: search["mode"] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Entrar na Lyrem AI — Lyrem" },
      {
        name: "description",
        content:
          "Crie a sua conta Lyrem AI ou entre para guardar as suas conversas com a Lyrem, a assistente da Lyrem 4 Pro.",
      },
      { property: "og:title", content: "Entrar na Lyrem AI — Lyrem" },
      {
        property: "og:description",
        content: "Crie a sua conta Lyrem AI ou entre para conversar com a Lyrem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setInfo("Conta criada! Confirme o seu email para entrar.");
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      setError((err as Error).message || "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Não foi possível entrar com a Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_20%,transparent),transparent)]"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card/90 p-7 backdrop-blur glow-purple">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar ao chat
        </Link>

        <div className="flex flex-col items-center text-center">
          <LyremLogo className="size-16" />
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Criar conta na Lyrem AI" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Lyrem 4 Pro</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="mt-7 w-full rounded-xl"
          onClick={google}
        >
          Continuar com a Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como quer ser chamado"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}

          <Button type="submit" disabled={busy} className="w-full rounded-xl">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <Link
            to="/auth"
            search={{ mode: mode === "signup" ? "login" : "signup" }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "signup" ? "Entrar" : "Registar"}
          </Link>
        </p>
      </div>
    </div>
  );
}
