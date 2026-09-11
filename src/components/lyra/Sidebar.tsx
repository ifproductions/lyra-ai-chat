import { MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Settings, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/lyra-store";

type Props = {
  open: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
};

export function Sidebar({
  open,
  onToggle,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onOpenSettings,
}: Props) {
  return (
    <aside
      className={cn(
        "z-30 flex h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out",
        open ? "w-72" : "w-[68px]",
        "max-md:fixed max-md:left-0 max-md:top-0",
        !open && "max-md:w-[60px]",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-4">
        <button
          onClick={onToggle}
          aria-label={open ? "Recolher barra lateral" : "Expandir barra lateral"}
          className="flex size-10 items-center justify-center rounded-xl text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {open ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
        </button>
        {open && (
          <span className="truncate text-sm font-semibold tracking-wide text-sidebar-foreground">
            IF <span className="text-primary">AI</span>
          </span>
        )}
      </div>

      <div className="px-3">
        <Button
          onClick={onNewChat}
          className={cn(
            "w-full gap-2 rounded-xl bg-primary/15 text-primary-foreground ring-1 ring-primary/40 hover:bg-primary/25",
            !open && "px-0",
          )}
          variant="ghost"
        >
          <Plus className="size-4 shrink-0 text-primary" />
          {open && <span className="text-sidebar-foreground">Novo chat</span>}
        </Button>
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-3">
        {open && (
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Histórico
          </p>
        )}
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <button
                onClick={() => onSelect(c.id)}
                title={c.title}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  c.id === activeId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60",
                  !open && "justify-center px-0",
                )}
              >
                <MessageSquare
                  className={cn("size-4 shrink-0", c.id === activeId && "text-primary")}
                />
                {open && <span className="truncate pr-5">{c.title}</span>}
              </button>
              {open && (
                <button
                  onClick={() => onDelete(c.id)}
                  aria-label={`Apagar conversa ${c.title}`}
                  className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-muted-foreground transition-colors hover:text-destructive group-hover:block"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
          {open && conversations.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Ainda sem conversas.</li>
          )}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onOpenSettings}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent",
            !open && "justify-center px-0",
          )}
        >
          <Settings className="size-4 shrink-0" />
          {open && <span>Configurações</span>}
        </button>
      </div>
    </aside>
  );
}
