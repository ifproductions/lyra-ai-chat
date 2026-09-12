import { useEffect, useState } from "react";
import { Moon, Settings2, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_OPTIONS, type LyraSettings, type Theme } from "@/lib/lyra-store";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LyraSettings;
  onSave: (settings: LyraSettings) => void;
};

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "light", label: "Claro", icon: Sun },
];

export function SettingsDialog({ open, onOpenChange, settings, onSave }: Props) {
  const [model, setModel] = useState(settings.model);
  const [theme, setTheme] = useState<Theme>(settings.theme);

  useEffect(() => {
    if (open) {
      setModel(settings.model);
      setTheme(settings.theme);
    }
  }, [open, settings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-4 text-primary" />
            Configurações
          </DialogTitle>
          <DialogDescription>
            Personalize a aparência e a inteligência da Lyra. Não precisa de nenhuma chave.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label>Aparência</Label>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTheme(id);
                    onSave({ model, theme: id });
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-all",
                    theme === id
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-surface/60 text-muted-foreground hover:border-primary/30",
                  )}
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Inteligência</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model" className="w-full">
                <SelectValue placeholder="Escolha um modelo" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A Lyra responde com GPT-4 e pesquisa na web em tempo real.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave({ model, theme });
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
