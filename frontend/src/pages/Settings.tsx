import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, MessageCircle, CheckCircle, Smartphone, Loader2, QrCode, Power, ExternalLink } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const api = {
  get: async (url: string) => (await fetch(`/api${url}`)).json(),
  post: async (url: string) => (await fetch(`/api${url}`, { method: 'POST' })).json()
};

export default function Settings() {
  const { settings, saveSettings, hasSerpapiKey } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();

  const [serpapiKey, setSerpapiKey] = useState("");
  const [isSavingSerp, setIsSavingSerp] = useState(false);
  
  // Status visual
  const [waStatus, setWaStatus] = useState<"LOADING" | "CONNECTED" | "DISCONNECTED" | "SCANNING">("LOADING");
  const [qrCode, setQrCode] = useState<string>("");
  const [isWaLoading, setIsWaLoading] = useState(false);

  useEffect(() => {
    if (settings?.serpapiKey) setSerpapiKey(settings.serpapiKey);
  }, [settings]);

  // Polling Leve (Apenas checa status, não cria sessão)
  useEffect(() => {
    if (!user?.companyId) return;
    
    const check = async () => {
      try {
        const res = await api.get(`/whatsapp/status?company_id=${user.companyId}`);
        // Se estiver Working/Connected
        if (res.status === 'WORKING' || res.status === 'CONNECTED') {
          setWaStatus("CONNECTED");
          setQrCode(""); 
        } else if (waStatus !== "SCANNING") {
          // Só muda para disconnected se não estivermos mostrando o QR Code agora
          setWaStatus("DISCONNECTED");
        }
      } catch (e) { console.error(e); }
    };

    check();
    const interval = setInterval(check, 5000); // 5 segundos
    return () => clearInterval(interval);
  }, [user?.companyId, waStatus]);

  const handleSaveSerp = async () => {
    setIsSavingSerp(true);
    await saveSettings({ serpapiKey });
    setIsSavingSerp(false);
    toast({ title: "Salvo", description: "Chave SerpAPI atualizada." });
  };

  // BOTÃO MANUAL: Inicia o processo pesado (Criar Sessão + QR)
  const handleGenerateQR = async () => {
    if (!user?.companyId) return;
    setIsWaLoading(true);
    try {
      const res = await api.post(`/whatsapp/session/start?company_id=${user.companyId}`);
      
      if (res.image) {
        setQrCode(res.image);
        setWaStatus("SCANNING");
        toast({ title: "Aguardando Leitura", description: "Escaneie o código com seu celular." });
      } else if (res.status === 'connected') {
        setWaStatus("CONNECTED");
        toast({ title: "Conectado", description: "O WhatsApp já está ativo." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao iniciar sessão." });
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if(!confirm("Tem certeza? Isso irá parar os envios.")) return;
    setIsWaLoading(true);
    try {
      await api.post(`/whatsapp/session/stop?company_id=${user.companyId}`);
      setWaStatus("DISCONNECTED");
      setQrCode("");
      toast({ title: "Desconectado", description: "Sessão encerrada." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao desconectar." });
    } finally {
      setIsWaLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie suas chaves e conexões.</p>
      </div>

      <div className="grid gap-8">
        
        {/* SERP API */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>SerpAPI (Busca de Leads)</CardTitle>
                  <CardDescription>Necessário para usar o módulo de Busca.</CardDescription>
                </div>
              </div>
              <Badge variant={hasSerpapiKey ? "default" : "outline"}>{hasSerpapiKey ? "Ativo" : "Pendente"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={serpapiKey} 
                onChange={e => setSerpapiKey(e.target.value)} 
                placeholder="Sua chave SerpAPI..." 
              />
              <Button onClick={handleSaveSerp} disabled={isSavingSerp}>
                {isSavingSerp ? <Loader2 className="animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WHATSAPP CONNECTION */}
        <Card className={`border-l-4 shadow-sm ${waStatus === 'CONNECTED' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className={`h-6 w-6 ${waStatus === 'CONNECTED' ? 'text-green-600' : 'text-orange-600'}`} />
                <div>
                  <CardTitle>Conexão WhatsApp</CardTitle>
                  <CardDescription>Necessário para o Disparador de Mensagens.</CardDescription>
                </div>
              </div>
              {waStatus === 'CONNECTED' ? (
                <Badge className="bg-green-600">Conectado</Badge>
              ) : (
                <Badge variant="secondary">Desconectado</Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center p-6 bg-slate-50/50 min-h-[200px]">
            
            {waStatus === 'LOADING' && (
               <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin"/> Verificando...</div>
            )}

            {waStatus === 'CONNECTED' && (
              <div className="text-center space-y-4 animate-in fade-in zoom-in">
                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="h-8 w-8" />
                </div>
                <p className="text-green-800 font-medium">WhatsApp Conectado e Pronto!</p>
                <Button variant="outline" onClick={handleDisconnect} disabled={isWaLoading} className="text-red-600 hover:bg-red-50">
                  Desconectar
                </Button>
              </div>
            )}

            {waStatus === 'DISCONNECTED' && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Clique abaixo para gerar um novo QR Code.</p>
                <Button onClick={handleGenerateQR} disabled={isWaLoading} className="bg-green-600 hover:bg-green-700">
                  {isWaLoading ? <Loader2 className="mr-2 animate-spin"/> : <QrCode className="mr-2 h-4 w-4"/>}
                  Gerar QR Code
                </Button>
              </div>
            )}

            {waStatus === 'SCANNING' && qrCode && (
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-3 rounded-lg shadow-lg border inline-block">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm font-medium">Escaneie com seu WhatsApp (Menu &gt; Aparelhos Conectados)</p>
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}