import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { CampaignCard } from "./CampaignCard";
import { MessageLogsDialog } from "./MessageLogsDialog";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useSubscription } from "@/hooks/useSubscription";
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Settings,
  Lock,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Disparador() {
  const { campaigns, isLoading, fetchCampaigns } = useCampaigns();
  const { settings, hasWahaConfig, isLoading: isLoadingSettings } = useCompanySettings();
  const { currentPlan, isLoading: isLoadingSubscription } = useSubscription();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check if user has access to Disparador (professional or business plan)
  const hasDisparadorAccess = currentPlan.id === "professional" || currentPlan.id === "business";

  // WAHA config from company settings
  const wahaConfig = hasWahaConfig && settings ? {
    url: settings.wahaApiUrl!,
    apiKey: settings.wahaApiKey!,
    session: settings.wahaSession || "default"
  } : undefined;

  // Auto-refresh campaigns every 5 seconds when there are running campaigns
  useEffect(() => {
    const hasRunning = campaigns.some((c) => c.status === "running");
    
    if (autoRefresh && hasRunning && hasDisparadorAccess) {
      const interval = setInterval(() => {
        fetchCampaigns();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, campaigns, fetchCampaigns, hasDisparadorAccess]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Calculate stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === "running").length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    totalContacts: campaigns.reduce((sum, c) => sum + c.total_contacts, 0),
  };

  if (isLoadingSettings || isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show upgrade required page if user doesn't have access
  if (!hasDisparadorAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-yellow-500/10 p-4 mb-6">
                <Lock className="h-12 w-12 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                O Disparador de Mensagens WhatsApp está disponível apenas para os planos 
                <strong className="text-foreground"> Professional</strong> e 
                <strong className="text-foreground"> Business</strong>.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6 text-left w-full max-w-sm">
                <p className="text-sm font-medium mb-2">Seu plano atual:</p>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-bold">{currentPlan.name}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco para fazer upgrade do seu plano.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              Disparador de Mensagens
            </h1>
            <p className="text-muted-foreground">
              Envie mensagens em massa para seus leads via WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCampaigns()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <CreateCampaignDialog onCreated={() => fetchCampaigns()} />
          </div>
        </div>

        {/* Warning if WAHA not configured */}
        {!hasWahaConfig && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm">
                  Configure suas credenciais WAHA em <strong>Configurações</strong> antes de iniciar campanhas.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Campanhas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
              <Loader2 className={`h-4 w-4 ${stats.activeCampaigns > 0 ? "animate-spin text-green-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Contatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContacts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma campanha ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira campanha para começar a enviar mensagens.
              </p>
              <CreateCampaignDialog onCreated={() => fetchCampaigns()} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onViewLogs={(id) => setSelectedCampaignId(id)}
                wahaConfig={wahaConfig}
                onRefresh={() => fetchCampaigns()}
              />
            ))}
          </div>
        )}

        {/* Message Logs Dialog */}
        <MessageLogsDialog
          campaignId={selectedCampaignId}
          campaignName={selectedCampaign?.name}
          onClose={() => setSelectedCampaignId(null)}
        />
      </main>
    </div>
  );
}
