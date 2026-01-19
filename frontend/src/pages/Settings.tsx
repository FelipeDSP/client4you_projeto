import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Key, Globe, MessageCircle, Eye, EyeOff, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";

export default function Settings() {
  const { settings, isLoading, isSaving, saveSettings, hasSerpapiKey, hasWahaConfig } = useCompanySettings();

  const [serpapiKey, setSerpapiKey] = useState("");
  const [wahaApiUrl, setWahaApiUrl] = useState("");
  const [wahaApiKey, setWahaApiKey] = useState("");
  const [wahaSession, setWahaSession] = useState("");
  const [showSerpapiKey, setShowSerpapiKey] = useState(false);
  const [showWahaKey, setShowWahaKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setSerpapiKey(settings.serpapiKey || "");
      setWahaApiUrl(settings.wahaApiUrl || "");
      setWahaApiKey(settings.wahaApiKey || "");
      setWahaSession(settings.wahaSession || "default");
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings({
      serpapiKey,
      wahaApiUrl,
      wahaApiKey,
      wahaSession,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Configure suas chaves de API para extração de leads
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* SerpAPI Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">SerpAPI</CardTitle>
                    <CardDescription>Extração de dados do Google Maps</CardDescription>
                  </div>
                </div>
                <Badge variant={hasSerpapiKey ? "default" : "secondary"} className="gap-1">
                  {hasSerpapiKey ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Configurado
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Não configurado
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serpapi-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="serpapi-key"
                    type={showSerpapiKey ? "text" : "password"}
                    value={serpapiKey}
                    onChange={(e) => setSerpapiKey(e.target.value)}
                    placeholder="Cole sua chave da SerpAPI aqui"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSerpapiKey(!showSerpapiKey)}
                  >
                    {showSerpapiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em{" "}
                  <a
                    href="https://serpapi.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    serpapi.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* WAHA API Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WAHA API</CardTitle>
                    <CardDescription>Validação de números WhatsApp</CardDescription>
                  </div>
                </div>
                <Badge variant={hasWahaConfig ? "default" : "secondary"} className="gap-1">
                  {hasWahaConfig ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Configurado
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Não configurado
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waha-url">URL da API</Label>
                <Input
                  id="waha-url"
                  type="url"
                  value={wahaApiUrl}
                  onChange={(e) => setWahaApiUrl(e.target.value)}
                  placeholder="https://api.minha-instancia.com.br"
                />
                <p className="text-xs text-muted-foreground">
                  URL base da sua instância WAHA (ex: https://api.exemplo.com.br)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waha-session">Nome da Sessão</Label>
                <Input
                  id="waha-session"
                  type="text"
                  value={wahaSession}
                  onChange={(e) => setWahaSession(e.target.value)}
                  placeholder="minha-sessao"
                />
                <p className="text-xs text-muted-foreground">
                  Nome da sessão configurada no WAHA (ex: principal, whatsapp-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waha-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="waha-key"
                    type={showWahaKey ? "text" : "password"}
                    value={wahaApiKey}
                    onChange={(e) => setWahaApiKey(e.target.value)}
                    placeholder="Cole sua chave da WAHA API aqui"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowWahaKey(!showWahaKey)}
                  >
                    {showWahaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chave de autenticação da API WAHA
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Info Card */}
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Sobre as Integrações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>SerpAPI:</strong> Serviço que permite extrair dados do Google Maps, incluindo nome,
                endereço, telefone e avaliações dos estabelecimentos.
              </p>
              <p>
                <strong>WAHA API:</strong> API WhatsApp auto-hospedada que permite validar se um número
                de telefone possui WhatsApp ativo.
              </p>
              <p className="text-xs pt-2">
                ⚠️ Suas chaves são armazenadas de forma segura e nunca são compartilhadas.
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
