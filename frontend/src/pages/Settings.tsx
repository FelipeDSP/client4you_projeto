import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, MessageCircle, Smartphone, Loader2, QrCode, Power, LogOut, RefreshCw } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const api = {
  get: async (url: string) => (await fetch(`/api${url}`)).json(),
  post: async (url: string) => (await fetch(`/api${url}`, { method: 'POST' })).json()
};

type WAStatus = "LOADING" | "DISCONNECTED" | "STARTING" | "SCANNING" | "CONNECTED";

export default function Settings() {
  const { settings, saveSettings, hasSerpapiKey } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();

  const [serpapiKey, setSerpapiKey] = useState("");
  const [isSavingSerp, setIsSavingSerp] = useState(false);
  
  // Estados do Painel WhatsApp
  const [waStatus, setWaStatus] = useState<WAStatus>("LOADING");
  const [qrCode, setQrCode] = useState<string>("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (settings?.serpapiKey) setSerpapiKey(settings.serpapiKey);
  }, [settings]);

  // 1. Polling de Status: Verifica o estado da sessão a cada 5 segundos
  useEffect(() => {
    if (!user?.companyId) return;
    
    const checkStatus = async () => {
      try {
        const res = await api.get(`/whatsapp/status?company_id=${user.companyId}`);
        setWaStatus(res.status);
        
        // Se o status for SCANNING e não tivermos o QR ainda, buscamos
        if (res.status === "SCANNING" && !qrCode) {
          fetchQR();
        } else if (res.status !== "SCANNING") {
          setQrCode(""); // Limpa o QR se não estiver mais em modo de scan
        }
      } catch (e) {
        console.error("Erro ao checar status:", e);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    checkStatus(); // Executa imediato ao montar
    return () => clearInterval(interval);
  }, [user?.companyId, qrCode]);

  const fetchQR = async () => {
    try {
      const res = await api.get(`/whatsapp/qr?company_id=${user.companyId}`);
      if (res.image) setQrCode(res.image);
    } catch (e) { console.error("Erro ao buscar QR:", e); }
  };

  // Ações do Painel
  const handleStartSession = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/whatsapp/session/start?company_id=${user.companyId}`);
      toast({ title: "Iniciando...", description: "O motor do WhatsApp está ligando." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao iniciar motor." });
    } finally { setIsActionLoading(false); }
  };

  const handleStopSession = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/whatsapp/session/stop?company_id=${user.companyId}`);
      toast({ title: "Sessão Parada", description: "O motor foi desligado." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao parar motor." });
    } finally { setIsActionLoading(false); }
  };

  const handleLogout = async () => {
    if(!confirm("Isso desconectará seu celular. Confirmar?")) return;
    setIsActionLoading(true);
    try {
      await api.post(`/whatsapp/session/logout?company_id=${user.companyId}`);
      toast({ title: "Desconectado", description: "Sessão encerrada com sucesso." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao deslogar." });
    } finally { setIsActionLoading(false); }
  };

  // Handler para salvar chave SERP API
  const handleSaveSerpapiKey = async () => {
    if (!serpapiKey.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Por favor, insira uma chave válida." });
      return;
    }

    setIsSavingSerp(true);
    try {
      const success = await saveSettings({ serpapiKey: serpapiKey.trim() });
      if (success) {
        toast({ title: "Sucesso!", description: "Chave SERP API salva com sucesso." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar chave." });
    } finally {
      setIsSavingSerp(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Gerencie suas chaves e conexões do sistema.</p>
      </div>

      <div className="grid gap-8">
        {/* SERP API CARD */}
        <Card className={`border-l-4 ${hasSerpapiKey ? 'border-l-green-500' : 'border-l-orange-500'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className={`h-6 w-6 ${hasSerpapiKey ? 'text-green-600' : 'text-orange-600'}`} />
                <div>
                  <CardTitle>Chave SERP API</CardTitle>
                  <CardDescription>Configure sua chave para buscar leads no Google.</CardDescription>
                </div>
              </div>
              <Badge variant={hasSerpapiKey ? 'default' : 'secondary'}>
                {hasSerpapiKey ? 'Configurado' : 'Não Configurado'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="serpapi-key" className="text-sm font-medium">
                Chave da API
              </label>
              <Input
                id="serpapi-key"
                type="password"
                placeholder="Insira sua chave SERP API"
                value={serpapiKey}
                onChange={(e) => setSerpapiKey(e.target.value)}
                disabled={isSavingSerp}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha sua chave em:{" "}
                <a 
                  href="https://serpapi.com/manage-api-key" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  serpapi.com/manage-api-key
                </a>
              </p>
            </div>
            
            <Button 
              onClick={handleSaveSerpapiKey} 
              disabled={isSavingSerp || !serpapiKey.trim()}
              className="w-full sm:w-auto"
            >
              {isSavingSerp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Chave'
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* WHATSAPP MANAGEMENT PANEL */}
        <Card className={`border-l-4 ${waStatus === 'CONNECTED' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className={`h-6 w-6 ${waStatus === 'CONNECTED' ? 'text-green-600' : 'text-orange-600'}`} />
                <div>
                  <CardTitle>Gerenciamento de Sessão WhatsApp</CardTitle>
                  <CardDescription>Controle o motor de disparo e conexão.</CardDescription>
                </div>
              </div>
              <Badge variant={waStatus === 'CONNECTED' ? 'default' : 'secondary'}>
                {waStatus}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button 
                onClick={handleStartSession} 
                disabled={isActionLoading || waStatus === 'CONNECTED' || waStatus === 'STARTING' || waStatus === 'SCANNING'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Power className="mr-2 h-4 w-4" /> Criar/Iniciar Sessão
              </Button>

              <Button 
                variant="outline" 
                onClick={handleStopSession} 
                disabled={isActionLoading || waStatus === 'DISCONNECTED'}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar Motor
              </Button>

              <Button 
                variant="destructive" 
                onClick={handleLogout} 
                disabled={isActionLoading || waStatus === 'DISCONNECTED'}
              >
                <LogOut className="mr-2 h-4 w-4" /> Desconectar Conta
              </Button>
            </div>

            <div className="border rounded-lg p-6 bg-slate-50/50 flex flex-col items-center justify-center min-h-[250px]">
              {waStatus === 'LOADING' && <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />}
              
              {waStatus === 'STARTING' && (
                <div className="text-center space-y-2">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500" />
                  <p className="font-medium">Iniciando motor na VPS...</p>
                  <p className="text-xs text-muted-foreground">Isso pode levar até 30 segundos.</p>
                </div>
              )}

              {waStatus === 'SCANNING' && (
                <div className="text-center space-y-4">
                  {qrCode ? (
                    <div className="bg-white p-2 rounded shadow-sm inline-block border">
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-60 h-60" />
                    </div>
                  ) : (
                    <div className="w-60 h-60 flex items-center justify-center border bg-white rounded">
                      <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-sm font-medium">Escaneie o QR Code para conectar</p>
                </div>
              )}

              {waStatus === 'CONNECTED' && (
                <div className="text-center space-y-3">
                  <div className="bg-green-100 p-4 rounded-full inline-block">
                    <Smartphone className="h-10 w-10 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-700">WhatsApp Conectado!</p>
                  <p className="text-sm text-muted-foreground">Seu sistema está pronto para realizar disparos.</p>
                </div>
              )}

              {waStatus === 'DISCONNECTED' && (
                <div className="text-center text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma sessão ativa. Clique em "Criar/Iniciar Sessão" para começar.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}