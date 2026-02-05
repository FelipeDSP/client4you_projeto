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
  timezone: string; // NOVO CAMPO
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
      // 1. Busca configurações gerais (API Keys, etc)
      const { data: settingsData, error: settingsError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", user.companyId)
        .maybeSingle();

      // 2. Busca dados da empresa (timezone)
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("timezone")
        .eq("id", user.companyId)
        .single();

      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
      } 
      
      // Monta o objeto final combinando as duas tabelas
      if (settingsData) {
        setSettings({
          id: settingsData.id,
          companyId: settingsData.company_id,
          serpapiKey: settingsData.serpapi_key,
          wahaApiUrl: settingsData.waha_api_url,
          wahaApiKey: settingsData.waha_api_key,
          wahaSession: settingsData.waha_session,
          timezone: companyData?.timezone || 'America/Sao_Paulo', // Valor padrão seguro
          createdAt: settingsData.created_at,
          updatedAt: settingsData.updated_at,
        });
      } else if (companyData) {
        // Caso raro: tem empresa mas não tem settings criado ainda
        setSettings({
          id: "", // Placeholder
          companyId: user.companyId,
          serpapiKey: null,
          wahaApiUrl: null,
          wahaApiKey: null,
          wahaSession: "default",
          timezone: companyData.timezone || 'America/Sao_Paulo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        setSettings(null);
      }

    } catch (error) {
      console.error("Unexpected error:", error);
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
    timezone?: string; // NOVO CAMPO OPCIONAL
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
      // 1. Atualiza company_settings (API Keys)
      const settingsData = {
        company_id: user.companyId,
        serpapi_key: newSettings.serpapiKey !== undefined ? newSettings.serpapiKey : settings?.serpapiKey,
        waha_api_url: newSettings.wahaApiUrl !== undefined ? newSettings.wahaApiUrl : settings?.wahaApiUrl,
        waha_api_key: newSettings.wahaApiKey !== undefined ? newSettings.wahaApiKey : settings?.wahaApiKey,
        waha_session: newSettings.wahaSession !== undefined ? newSettings.wahaSession : (settings?.wahaSession || 'default'),
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from("company_settings")
          .update({
            serpapi_key: settingsData.serpapi_key,
            waha_api_url: settingsData.waha_api_url,
            waha_api_key: settingsData.waha_api_key,
            waha_session: settingsData.waha_session,
            updated_at: settingsData.updated_at
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("company_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      // 2. Atualiza Timezone na tabela companies (se foi enviado)
      if (newSettings.timezone && newSettings.timezone !== settings?.timezone) {
        const { error: companyError } = await supabase
          .from("companies")
          .update({ timezone: newSettings.timezone })
          .eq("id", user.companyId);
          
        if (companyError) throw companyError;
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