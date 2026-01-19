import { useState, useEffect } from "react";
import { Settings, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWahaConfig } from "@/hooks/useWahaConfig";

export function WahaConfigCard() {
  const { config, isLoading, isTesting, isSaving, saveConfig, testConnection } = useWahaConfig();
  const [wahaUrl, setWahaUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [sessionName, setSessionName] = useState("default");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (config) {
      setWahaUrl(config.waha_url || "");
      setSessionName(config.session_name || "default");
    }
  }, [config]);

  const handleSave = async () => {
    await saveConfig(wahaUrl, apiKey, sessionName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração WAHA
        </CardTitle>
        <CardDescription>
          Configure as credenciais do seu servidor WAHA para envio de mensagens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="waha-url">URL do WAHA</Label>
            <Input
              id="waha-url"
              placeholder="http://localhost:3000"
              value={wahaUrl}
              onChange={(e) => setWahaUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-name">Nome da Sessão</Label>
            <Input
              id="session-name"
              placeholder="default"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              placeholder="Sua API Key do WAHA"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {config && (
            <p className="text-xs text-muted-foreground">
              Chave salva: {config.api_key}
            </p>
          )}
        </div>

        {/* Connection Status */}
        {config && (
          <div className="flex items-center gap-2 text-sm">
            {config.is_connected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Conectado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Desconectado</span>
              </>
            )}
            {config.last_check && (
              <span className="text-muted-foreground">
                (Verificado em {new Date(config.last_check).toLocaleString("pt-BR")})
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || !wahaUrl}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuração"
            )}
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={isTesting || !config}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              "Testar Conexão"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
