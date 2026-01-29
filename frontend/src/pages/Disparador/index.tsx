import { useState, useEffect } from "react";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { CampaignCard } from "./CampaignCard";
import { MessageLogsDialog } from "./MessageLogsDialog";
import { QuotaLimitModal } from "@/components/QuotaLimitModal";
import { ConfigurationAlert } from "@/components/ConfigurationAlert";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useQuotas } from "@/hooks/useQuotas";
import { usePageTitle } from "@/contexts/PageTitleContext";
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
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {
    setPageTitle("Disparador", Send);
  }, [setPageTitle]);

  const { campaigns, isLoading, fetchCampaigns } = useCampaigns();
  const { settings, hasWahaConfig, isLoading: isLoadingSettings } = useCompanySettings();
  const { quota, canUseCampaigns } = useQuotas();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const wahaConfig = hasWahaConfig && settings ? {
    url: settings.wahaApiUrl!,
    apiKey: settings.wahaApiKey!,
    session: settings.wahaSession || "default"
  } : undefined;

  useEffect(() => {
    const hasRunning = campaigns.some((c) => c.status === "running");
    
    if (autoRefresh && hasRunning && canUseCampaigns) {
      const interval = setInterval(() => {
        fetchCampaigns();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, campaigns, fetchCampaigns, canUseCampaigns]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === "running").length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    totalContacts: campaigns.reduce((sum, c) => sum + c.total_contacts, 0),
  };

  if (isLoadingSettings || !quota) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canUseCampaigns) {
    return (
      <div className="py-12 animate-fade-in">
        <Card className="max-w-2xl mx-auto shadow-sm border-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-6">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Disparador Bloqueado 🔒</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              O Disparador de Mensagens WhatsApp está disponível apenas nos planos 
              <strong className="text-foreground"> Pro</strong> e 
              <strong className="text-foreground"> Enterprise</strong>.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6 text-left w-full max-w-sm">
              <p className="text-sm font-medium mb-2">Seu plano atual:</p>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-bold">{quota.plan_name}</span>
              </div>
            </div>
            <Link to="/plans">
              <Button size="lg" className="gap-2">
                <Crown className="h-4 w-4" />
                Ver Planos e Fazer Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Disparador</h2>
          <p className="text-muted-foreground mt-1">
            Envie mensagens em massa para seus leads via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCampaigns()}
            disabled={isLoading}
            className="bg-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <CreateCampaignDialog onCreated={() => fetchCampaigns()} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campanhas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas Ativas</CardTitle>
            <Loader2 className={`h-4 w-4 ${stats.activeCampaigns > 0 ? "animate-spin text-green-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mensagens Enviadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalSent}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalContacts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-white shadow-sm border-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Nenhuma campanha ainda</h3>
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

      <MessageLogsDialog
        campaignId={selectedCampaignId}
        campaignName={selectedCampaign?.name}
        onClose={() => setSelectedCampaignId(null)}
      />
    </div>
  );
}