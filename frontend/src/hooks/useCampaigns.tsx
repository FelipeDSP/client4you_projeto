import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export type CampaignStatus = "draft" | "ready" | "running" | "paused" | "completed" | "cancelled";
export type MessageType = "text" | "image" | "document";

export interface CampaignMessage {
  type: MessageType;
  text: string;
  media_url?: string;
  media_base64?: string;
  media_filename?: string;
}

export interface CampaignSettings {
  interval_min: number;
  interval_max: number;
  start_time?: string;
  end_time?: string;
  daily_limit?: number;
  working_days: number[];
}

export interface CampaignStats {
  total: number;
  sent: number;
  pending: number;
  errors: number;
  progress_percent: number;
}

export interface Campaign {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  status: CampaignStatus;
  message: CampaignMessage;
  settings: CampaignSettings;
  total_contacts: number;
  sent_count: number;
  error_count: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  stats: CampaignStats;
  is_worker_running: boolean;
}

export interface Contact {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  extra_data: Record<string, string>;
  status: "pending" | "sent" | "error" | "skipped";
  error_message?: string;
  sent_at?: string;
}

export interface MessageLog {
  id: string;
  campaign_id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  status: "pending" | "sent" | "error" | "skipped";
  error_message?: string;
  message_sent?: string;
  sent_at: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCampaigns = useCallback(async () => {
    if (!user?.companyId) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/campaigns?company_id=${user.companyId}`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (
    name: string,
    message: CampaignMessage,
    settings: CampaignSettings
  ): Promise<Campaign | null> => {
    if (!user?.companyId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns?company_id=${user.companyId}&user_id=${user.id}`, 
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, message, settings }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao criar campanha");
      }

      const campaign = await response.json();
      await fetchCampaigns();
      
      toast({
        title: "Campanha criada!",
        description: `Campanha "${name}" criada com sucesso.`,
      });
      
      return campaign;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a campanha.",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadContacts = async (campaignId: string, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaignId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao fazer upload");
      }

      const data = await response.json();
      await fetchCampaigns();

      toast({
        title: "Upload concluído!",
        description: `${data.total_imported} contatos importados. ${data.skipped} ignorados.`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload dos contatos.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startCampaign = async (
    campaignId: string,
    wahaConfig?: { url: string; apiKey: string; session: string }
  ): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
      
      if (user?.companyId) {
        params.append("company_id", user.companyId);
      }
      
      if (wahaConfig) {
        params.append("waha_url", wahaConfig.url);
        params.append("waha_api_key", wahaConfig.apiKey);
        params.append("waha_session", wahaConfig.session);
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns/${campaignId}/start?${params.toString()}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao iniciar campanha");
      }

      await fetchCampaigns();
      toast({
        title: "Campanha iniciada!",
        description: "O disparo de mensagens foi iniciado.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar a campanha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const pauseCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns/${campaignId}/pause`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Erro ao pausar campanha");
      }

      await fetchCampaigns();
      toast({
        title: "Campanha pausada",
        description: "O disparo foi pausado.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível pausar a campanha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns/${campaignId}/cancel`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Erro ao cancelar campanha");
      }

      await fetchCampaigns();
      toast({
        title: "Campanha cancelada",
        description: "A campanha foi cancelada.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a campanha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const resetCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns/${campaignId}/reset`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Erro ao resetar campanha");
      }

      await fetchCampaigns();
      toast({
        title: "Campanha resetada",
        description: "Todos os contatos foram marcados como pendentes.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível resetar a campanha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns/${campaignId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Erro ao excluir campanha");
      }

      await fetchCampaigns();
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a campanha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getMessageLogs = async (
    campaignId: string,
    limit: number = 100
  ): Promise<MessageLog[]> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/campaigns/${campaignId}/logs?limit=${limit}`
      );
      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
  };

  return {
    campaigns,
    isLoading,
    fetchCampaigns,
    createCampaign,
    uploadContacts,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    resetCampaign,
    deleteCampaign,
    getMessageLogs,
  };
}
