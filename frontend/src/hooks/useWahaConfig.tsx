import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

export interface WahaConfig {
  id: string;
  waha_url: string;
  api_key: string;
  session_name: string;
  is_connected: boolean;
  last_check: string | null;
}

export function useWahaConfig() {
  const [config, setConfig] = useState<WahaConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/waha/config?user_id=default`);
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error("Error fetching WAHA config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (wahaUrl: string, apiKey: string, sessionName: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/waha/config?user_id=default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waha_url: wahaUrl,
          api_key: apiKey,
          session_name: sessionName,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configuração");
      }

      await fetchConfig();
      toast({
        title: "Configuração salva!",
        description: "As credenciais do WAHA foram salvas com sucesso.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/waha/test?user_id=default`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.connected) {
        toast({
          title: "Conexão OK!",
          description: `WAHA conectado com sucesso. Status: ${data.status}`,
        });
        await fetchConfig();
        return true;
      } else {
        toast({
          title: "Conexão falhou",
          description: data.error || "Não foi possível conectar ao WAHA.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível testar a conexão.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  return {
    config,
    isLoading,
    isTesting,
    isSaving,
    saveConfig,
    testConnection,
    refetch: fetchConfig,
  };
}
