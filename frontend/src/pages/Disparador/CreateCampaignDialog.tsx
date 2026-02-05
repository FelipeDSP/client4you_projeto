import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Loader2, Calendar, Clock, MessageSquare, Image as ImageIcon, Check, UploadCloud, FileSpreadsheet } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function CreateCampaignDialog({ open, onOpenChange, onSuccess }: CreateCampaignDialogProps) {
  const { createCampaign, uploadContacts, isCreating } = useCampaigns();
  
  // Estado do Formulário
  const [name, setName] = useState("");
  const [messageType, setMessageType] = useState<"text" | "image" | "document">("text");
  const [messageText, setMessageText] = useState("");
  
  // Arquivos
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  
  // Configurações
  const [intervalMin, setIntervalMin] = useState(30);
  const [intervalMax, setIntervalMax] = useState(120);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [workingDays, setWorkingDays] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [dailyLimit, setDailyLimit] = useState(500);

  const toggleDay = (dayValue: string) => {
    setWorkingDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('campaigns')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('campaigns')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({ 
        title: "Erro no Upload", 
        description: "Falha ao enviar imagem. Verifique se o bucket 'campaigns' existe e é público.", 
        variant: "destructive" 
      });
      return null;
    }
  };

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
    if ((messageType === 'image' || messageType === 'document') && !mediaFile) {
      toast({ title: "Erro", description: "Selecione uma imagem/arquivo para enviar.", variant: "destructive" });
      return;
    }
    if (!contactsFile) {
      toast({ title: "Erro", description: "A planilha de contatos é obrigatória.", variant: "destructive" });
      return;
    }
    if (workingDays.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um dia de funcionamento.", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      let finalMediaUrl: string | undefined = undefined;

      // 2. Upload da Mídia (se houver)
      if (mediaFile && (messageType === 'image' || messageType === 'document')) {
        const url = await uploadMedia(mediaFile);
        if (!url) {
          setIsUploading(false);
          return;
        }
        finalMediaUrl = url;
      }

      // 3. Montar Payload (Limpo)
      // Usamos undefined para campos opcionais vazios, assim o JSON.stringify remove a chave
      const campaignData = {
        name: name.trim(),
        message: {
          type: messageType,
          text: messageText || "", // Texto obrigatório, mesmo que vazio
          media_url: finalMediaUrl || undefined, // undefined remove do JSON
          media_filename: mediaFile ? mediaFile.name : (messageType === 'document' ? 'documento' : undefined)
        },
        settings: {
          interval_min: Math.floor(Number(intervalMin)),
          interval_max: Math.floor(Number(intervalMax)),
          start_time: startTime || "09:00",
          end_time: endTime || "18:00",
          daily_limit: Math.floor(Number(dailyLimit)) || 500,
          working_days: workingDays.map(d => parseInt(d, 10))
        }
      };

      console.log("Payload Enviado (v2):", JSON.stringify(campaignData, null, 2));

      // 4. Enviar
      const newCampaign = await createCampaign(
        campaignData.name,
        campaignData.message,
        campaignData.settings
      );
      
      // 5. Upload dos Contatos (Planilha)
      if (newCampaign && newCampaign.id) {
        toast({ title: "Enviando contatos...", description: "Processando sua planilha." });
        await uploadContacts(newCampaign.id, contactsFile);
        
        toast({ 
          title: "Sucesso!", 
          description: "Campanha criada e contatos importados.", 
          className: "bg-green-500 text-white" 
        });
        
        if (onSuccess) onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        toast({ title: "Campanha criada", description: "Atualize a página para ver." });
        if (onSuccess) onSuccess();
        onOpenChange(false);
      }
      
    } catch (error: any) {
      console.error("Erro completo:", error);
      
      // Extração avançada de erro 422
      let errorMessage = "Erro ao processar requisição.";
      if (error?.response?.data?.detail) {
        // Se for erro de validação do Pydantic, ele vem como um array
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((err: any) => `${err.loc.join('.')} -> ${err.msg}`)
            .join(' | ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      console.error("Mensagem Detalhada:", errorMessage);
      
      toast({ 
        title: "Erro ao criar", 
        description: `Falha: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`, 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMessageText("");
    setMediaFile(null);
    setContactsFile(null);
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
            Importe sua planilha e configure o disparo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Leads Janeiro 2025" 
              className="font-medium"
            />
          </div>

          {/* ÁREA DE IMPORTAÇÃO DE CONTATOS */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <Label className="text-base font-semibold text-slate-700">Planilha de Contatos</Label>
            </div>
            <Input 
              type="file" 
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setContactsFile(e.target.files?.[0] || null)}
              className="bg-white"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: .xlsx, .xls, .csv (Colunas obrigatórias: Nome, Telefone)
            </p>
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

            <TabsContent value="message" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo de Mensagem</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={messageType === 'text' ? 'default' : 'outline'}
                    className={`flex-1 ${messageType === 'text' ? 'bg-[#F59600] hover:bg-[#d68200] text-white' : ''}`}
                    onClick={() => setMessageType('text')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Texto
                  </Button>
                  <Button 
                    type="button"
                    variant={messageType === 'image' ? 'default' : 'outline'}
                    className={`flex-1 ${messageType === 'image' ? 'bg-[#F59600] hover:bg-[#d68200] text-white' : ''}`}
                    onClick={() => setMessageType('image')}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Imagem
                  </Button>
                </div>
              </div>

              {/* Upload de Imagem */}
              {messageType !== 'text' && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <Label htmlFor="mediaFile">Upload da Imagem</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                    <Input 
                      id="mediaFile" 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setMediaFile(e.target.files?.[0] || null)} 
                    />
                    {mediaFile ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-medium text-sm">{mediaFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-600 font-medium">Clique para selecionar uma imagem</span>
                        <span className="text-xs text-slate-400 mt-1">JPG, PNG (Máx 5MB)</span>
                      </>
                    )}
                  </div>
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

            <TabsContent value="settings" className="space-y-5 pt-4">
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
            disabled={isCreating || isUploading}
            className="bg-[#F59600] hover:bg-[#e08900] text-white font-semibold"
          >
            {isCreating || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isUploading ? "Enviando..." : "Criar Campanha"}
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