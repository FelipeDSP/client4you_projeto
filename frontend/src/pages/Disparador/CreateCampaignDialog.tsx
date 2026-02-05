import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Loader2, Calendar, Clock, MessageSquare, Image as ImageIcon, FileText, Check } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: "0", label: "D", fullName: "Domingo" },
  { value: "1", label: "S", fullName: "Segunda" },
  { value: "2", label: "T", fullName: "Terça" },
  { value: "3", label: "Q", fullName: "Quarta" },
  { value: "4", label: "Q", fullName: "Quinta" },
  { value: "5", label: "S", fullName: "Sexta" },
  { value: "6", label: "S", fullName: "Sábado" },
];

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const { createCampaign, isCreating } = useCampaigns();
  
  // Estado do Formulário
  const [name, setName] = useState("");
  const [messageType, setMessageType] = useState<"text" | "image" | "document">("text");
  const [messageText, setMessageText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  
  // Configurações
  const [intervalMin, setIntervalMin] = useState(30);
  const [intervalMax, setIntervalMax] = useState(120);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [workingDays, setWorkingDays] = useState<string[]>(["1", "2", "3", "4", "5"]); // Seg-Sex padrão
  const [dailyLimit, setDailyLimit] = useState(500);

  const handleSubmit = async () => {
    // 1. Validações Básicas
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome da campanha é obrigatório.", variant: "destructive" });
      return;
    }
    if (messageType === 'text' && !messageText.trim()) {
      toast({ title: "Erro", description: "O texto da mensagem é obrigatório.", variant: "destructive" });
      return;
    }
    if ((messageType === 'image' || messageType === 'document') && !mediaUrl.trim()) {
      toast({ title: "Erro", description: "A URL da mídia é obrigatória.", variant: "destructive" });
      return;
    }
    if (workingDays.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um dia de funcionamento.", variant: "destructive" });
      return;
    }

    try {
      // 2. Montar Payload (Compatível com backend/models.py)
      const campaignData = {
        name,
        message: {
          type: messageType,
          text: messageText,
          media_url: mediaUrl || null,
          media_filename: messageType === 'document' ? 'documento' : null
        },
        settings: {
          interval_min: Number(intervalMin),
          interval_max: Number(intervalMax),
          start_time: startTime,
          end_time: endTime,
          daily_limit: Number(dailyLimit),
          // Converte array de strings ["1", "2"] para inteiros [1, 2]
          working_days: workingDays.map(Number)
        }
      };

      // 3. Enviar
      await createCampaign(campaignData);
      
      // 4. Fechar e Limpar
      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      console.error(error);
      // Toast de erro já é tratado no hook geralmente, mas garantimos aqui
    }
  };

  const resetForm = () => {
    setName("");
    setMessageText("");
    setMediaUrl("");
    setWorkingDays(["1", "2", "3", "4", "5"]);
    setStartTime("09:00");
    setEndTime("18:00");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Nova Campanha</DialogTitle>
          <DialogDescription>
            Configure os detalhes do disparo em massa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Nome da Campanha */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Promoção de Verão" 
              className="font-medium"
            />
          </div>

          <Tabs defaultValue="message" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Mensagem
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Configurações
              </TabsTrigger>
            </TabsList>

            {/* ABA: MENSAGEM */}
            <TabsContent value="message" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo de Mensagem</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={messageType === 'text' ? 'default' : 'outline'}
                    className={`flex-1 ${messageType === 'text' ? 'bg-[#F59600] hover:bg-[#d68200]' : ''}`}
                    onClick={() => setMessageType('text')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Texto
                  </Button>
                  <Button 
                    type="button"
                    variant={messageType === 'image' ? 'default' : 'outline'}
                    className={`flex-1 ${messageType === 'image' ? 'bg-[#F59600] hover:bg-[#d68200]' : ''}`}
                    onClick={() => setMessageType('image')}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Imagem
                  </Button>
                  {/* Documento removido temporariamente para simplificar, ou descomente se necessário */}
                  {/* <Button 
                    type="button"
                    variant={messageType === 'document' ? 'default' : 'outline'}
                    className={`flex-1 ${messageType === 'document' ? 'bg-[#F59600] hover:bg-[#d68200]' : ''}`}
                    onClick={() => setMessageType('document')}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Arquivo
                  </Button> */}
                </div>
              </div>

              {messageType !== 'text' && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <Label htmlFor="mediaUrl">URL da Mídia (Imagem)</Label>
                  <Input 
                    id="mediaUrl" 
                    value={mediaUrl} 
                    onChange={(e) => setMediaUrl(e.target.value)} 
                    placeholder="https://exemplo.com/imagem.jpg" 
                  />
                  <p className="text-xs text-muted-foreground">Cole o link direto da imagem.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">
                  {messageType === 'text' ? 'Conteúdo da Mensagem' : 'Legenda da Imagem'}
                </Label>
                <Textarea 
                  id="message" 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder="Olá {Nome}, tudo bem? Temos uma oferta..." 
                  className="h-32 resize-none"
                />
                <div className="flex gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setMessageText(prev => prev + " {Nome}")}>
                    {`{Nome}`}
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setMessageText(prev => prev + " {Empresa}")}>
                    {`{Empresa}`}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            {/* ABA: CONFIGURAÇÕES */}
            <TabsContent value="settings" className="space-y-5 pt-4">
              
              {/* Intervalo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intervalo Mínimo (seg)</Label>
                  <Input 
                    type="number" 
                    value={intervalMin} 
                    onChange={(e) => setIntervalMin(Number(e.target.value))}
                    min={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo Máximo (seg)</Label>
                  <Input 
                    type="number" 
                    value={intervalMax} 
                    onChange={(e) => setIntervalMax(Number(e.target.value))}
                    min={15}
                  />
                </div>
              </div>

              {/* Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Início</Label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Fim</Label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Dias de Funcionamento</Label>
                <ToggleGroup type="multiple" value={workingDays} onValueChange={setWorkingDays} className="justify-start gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <ToggleGroupItem 
                      key={day.value} 
                      value={day.value}
                      aria-label={day.fullName}
                      className="h-9 w-9 rounded-full border border-slate-200 data-[state=on]:bg-[#054173] data-[state=on]:text-white data-[state=on]:border-[#054173]"
                    >
                      {day.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">Selecione os dias que o robô deve operar.</p>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Limite Diário de Envios</Label>
                <Select value={String(dailyLimit)} onValueChange={(v) => setDailyLimit(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 mensagens (Seguro)</SelectItem>
                    <SelectItem value="500">500 mensagens (Recomendado)</SelectItem>
                    <SelectItem value="1000">1000 mensagens</SelectItem>
                    <SelectItem value="2000">2000 mensagens (Alto Risco)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating}
            className="bg-[#F59600] hover:bg-[#e08900] text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Criar Campanha
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}