import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CompanySettings {
  id: string;
  companyId: string;
  serpapiKey: string | null;
  wahaApiUrl: string | null;
  wahaApiKey: string | null;
  wahaSession: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCompanySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user?.companyId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", user.companyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching company settings:", error);
        setSettings(null);
      } else if (data) {
        setSettings({
          id: data.id,
          companyId: data.company_id,
          serpapiKey: data.serpapi_key,
          wahaApiUrl: data.waha_api_url,
          wahaApiKey: data.waha_api_key,
          wahaSession: data.waha_session,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: {
    serpapiKey?: string;
    wahaApiUrl?: string;
    wahaApiKey?: string;
    wahaSession?: string;
  }) => {
    if (!user?.companyId) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);

    try {
      const settingsData = {
        company_id: user.companyId,
        serpapi_key: newSettings.serpapiKey || null,
        waha_api_url: newSettings.wahaApiUrl || null,
        waha_api_key: newSettings.wahaApiKey || null,
        waha_session: newSettings.wahaSession || 'default',
      };

      if (settings?.id) {
        // Update existing
        const { error } = await supabase
          .from("company_settings")
          .update({
            serpapi_key: settingsData.serpapi_key,
            waha_api_url: settingsData.waha_api_url,
            waha_api_key: settingsData.waha_api_key,
            waha_session: settingsData.waha_session,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("company_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      await fetchSettings();

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });

      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const hasSerpapiKey = Boolean(settings?.serpapiKey);
  const hasWahaConfig = Boolean(settings?.wahaApiUrl && settings?.wahaApiKey && settings?.wahaSession);

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    hasSerpapiKey,
    hasWahaConfig,
    refreshSettings: fetchSettings,
  };
}
