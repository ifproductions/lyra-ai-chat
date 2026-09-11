import { useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_OPTIONS, type LyraSettings } from "@/lib/lyra-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LyraSettings;
  onSave: (settings: LyraSettings) => void;
};

export function SettingsDialog({ open, onOpenChange, settings, onSave }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey(settings.apiKey);
      setModel(settings.model);
      setReveal(false);
    }
  }, [open, settings]);

  const custom = !MODEL_OPTIONS.some((m) => m.id === model);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            Configurações da Lyra
          </DialogTitle>
          <DialogDescription>
            A sua chave fica guardada apenas neste navegador e é usada para falar com a
            OpenRouter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave de API da OpenRouter</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={reveal ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                autoComplete="off"
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={reveal ? "Esconder chave" : "Mostrar chave"}
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Obter uma chave em openrouter.ai <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select value={custom ? "" : model} onValueChange={setModel}>
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
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ou escreva outro identificador de modelo"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave({ apiKey: apiKey.trim(), model: model.trim() });
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
