import { useState } from "react";
import { Plus, Loader2, Upload, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCampaigns, CampaignMessage, CampaignSettings, MessageType } from "@/hooks/useCampaigns";

const DAYS_OF_WEEK = [
  { value: 0, label: "Seg" },
  { value: 1, label: "Ter" },
  { value: 2, label: "Qua" },
  { value: 3, label: "Qui" },
  { value: 4, label: "Sex" },
  { value: 5, label: "Sáb" },
  { value: 6, label: "Dom" },
];

interface CreateCampaignDialogProps {
  onCreated: (campaignId: string) => void;
}

export function CreateCampaignDialog({ onCreated }: CreateCampaignDialogProps) {
  const { createCampaign, uploadContacts } = useCampaigns();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  
  // Settings
  const [intervalMin, setIntervalMin] = useState(30);
  const [intervalMax, setIntervalMax] = useState(60);
  const [useSchedule, setUseSchedule] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [useDailyLimit, setUseDailyLimit] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [workingDays, setWorkingDays] = useState([0, 1, 2, 3, 4]);

  const handleCreate = async () => {
    if (!name || !messageText || !contactsFile) return;

    setIsCreating(true);

    try {
      const message: CampaignMessage = {
        type: messageType,
        text: messageText,
      };

      // Handle media file if present
      if (mediaFile && messageType !== "text") {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(mediaFile);
        });
        message.media_base64 = base64.split(",")[1]; // Remove data URL prefix
        message.media_filename = mediaFile.name;
      }

      const settings: CampaignSettings = {
        interval_min: intervalMin,
        interval_max: intervalMax,
        working_days: workingDays,
        ...(useSchedule && { start_time: startTime, end_time: endTime }),
        ...(useDailyLimit && { daily_limit: dailyLimit }),
      };

      const campaign = await createCampaign(name, message, settings);

      if (campaign) {
        // Upload contacts
        await uploadContacts(campaign.id, contactsFile);
        onCreated(campaign.id);
        setOpen(false);
        resetForm();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMessageType("text");
    setMessageText("");
    setMediaFile(null);
    setContactsFile(null);
    setIntervalMin(30);
    setIntervalMax(60);
    setUseSchedule(false);
    setUseDailyLimit(false);
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
          <DialogDescription>
            Configure sua campanha de disparo de mensagens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              placeholder="Ex: Promoção Janeiro 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Contacts File */}
          <div className="space-y-2">
            <Label>Planilha de Contatos</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setContactsFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Aceita arquivos Excel (.xlsx, .xls) ou CSV. A planilha deve ter colunas "Nome" e "Telefone".
            </p>
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <Label>Tipo de Mensagem</Label>
            <Select value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="image">Imagem com Legenda</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Media File */}
          {messageType !== "text" && (
            <div className="space-y-2">
              <Label>Arquivo de Mídia</Label>
              <Input
                type="file"
                accept={messageType === "image" ? "image/*" : "*/*"}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          {/* Message Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="message">Mensagem</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Use variáveis para personalizar:</p>
                  <ul className="text-xs mt-1">
                    <li><code>{'{nome}'}</code> - Nome do contato</li>
                    <li><code>{'{telefone}'}</code> - Telefone</li>
                    <li><code>{'{categoria}'}</code> - Categoria</li>
                    <li><code>{'{email}'}</code> - Email</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="message"
              placeholder="Olá {nome}! Temos uma oferta especial para você..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
          </div>

          {/* Interval Settings */}
          <div className="space-y-4">
            <Label>Intervalo entre Mensagens</Label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mínimo: {intervalMin}s</span>
                <span>Máximo: {intervalMax}s</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Slider
                    value={[intervalMin]}
                    onValueChange={([v]) => setIntervalMin(v)}
                    min={5}
                    max={300}
                    step={5}
                  />
                </div>
                <div>
                  <Slider
                    value={[intervalMax]}
                    onValueChange={([v]) => setIntervalMax(Math.max(v, intervalMin))}
                    min={5}
                    max={300}
                    step={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-schedule">Horário de Funcionamento</Label>
              <Switch
                id="use-schedule"
                checked={useSchedule}
                onCheckedChange={setUseSchedule}
              />
            </div>
            {useSchedule && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Working Days */}
          <div className="space-y-2">
            <Label>Dias de Funcionamento</Label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center gap-1">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={workingDays.includes(day.value)}
                    onCheckedChange={() => toggleWorkingDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Limit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-limit">Limite Diário</Label>
              <Switch
                id="use-limit"
                checked={useDailyLimit}
                onCheckedChange={setUseDailyLimit}
              />
            </div>
            {useDailyLimit && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Máximo por dia: {dailyLimit} mensagens</span>
                </div>
                <Slider
                  value={[dailyLimit]}
                  onValueChange={([v]) => setDailyLimit(v)}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name || !messageText || !contactsFile}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Campanha"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
