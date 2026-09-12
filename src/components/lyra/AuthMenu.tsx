import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function AuthMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="h-9 w-24" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link to="/auth" search={{ mode: "login" }}>
            <LogIn className="size-4" /> Entrar
          </Link>
        </Button>
        <Button asChild size="sm" className="rounded-xl">
          <Link to="/auth" search={{ mode: "signup" }}>
            Registar
          </Link>
        </Button>
      </div>
    );
  }

  const name =
    (user.user_metadata?.["display_name"] as string | undefined) ??
    (user.user_metadata?.["full_name"] as string | undefined) ??
    user.email ??
    "Conta";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
          <span className="grid size-7 place-items-center rounded-full bg-primary/20 text-primary">
            <User className="size-4" />
          </span>
          <span className="hidden max-w-32 truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
