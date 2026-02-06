import { useState, useEffect, useCallback } from "react";
import { useCompanySettings } from "./useCompanySettings";

export type WAStatus = "LOADING" | "DISCONNECTED" | "STARTING" | "SCANNING" | "CONNECTED" | "NOT_CONFIGURED";

interface UseWahaStatusResult {
  status: WAStatus;
  isLoading: boolean;
  isConnected: boolean;
  refresh: () => void;
}

export function useWahaStatus(): UseWahaStatusResult {
  const { settings, hasWahaConfig, isLoading: isLoadingSettings, refreshSettings } = useCompanySettings();
  const [status, setStatus] = useState<WAStatus>("LOADING");
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    console.log("[useWahaStatus] Verificando status...", { hasWahaConfig, wahaApiUrl: settings?.wahaApiUrl });
    
    // Se não tem config, retorna NOT_CONFIGURED
    if (!hasWahaConfig || !settings?.wahaApiUrl) {
      console.log("[useWahaStatus] Sem config WAHA");
      setStatus("NOT_CONFIGURED");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const sessionName = settings.wahaSession || "default";
      const url = `${settings.wahaApiUrl}/api/sessions/${sessionName}`;
      
      console.log("[useWahaStatus] Chamando WAHA:", url);
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (settings.wahaApiKey) {
        headers["X-Api-Key"] = settings.wahaApiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { 
        method: "GET", 
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log("[useWahaStatus] Resposta não ok:", response.status);
        setStatus("DISCONNECTED");
        return;
      }

      const data = await response.json();
      console.log("[useWahaStatus] Resposta WAHA:", data);
      
      // Mapear status do WAHA para nosso status
      // WAHA pode retornar: WORKING, STOPPED, STARTING, SCAN_QR_CODE
      const wahaStatus = (data.status || data.engine?.state || "").toUpperCase();
      
      if (wahaStatus === "WORKING" || wahaStatus === "CONNECTED") {
        setStatus("CONNECTED");
      } else if (wahaStatus === "SCAN_QR_CODE" || wahaStatus === "SCANNING") {
        setStatus("SCANNING");
      } else if (wahaStatus === "STARTING") {
        setStatus("STARTING");
      } else {
        setStatus("DISCONNECTED");
      }
    } catch (error: any) {
      console.warn("[useWahaStatus] Erro ao verificar:", error?.message || error);
      // Se deu timeout ou erro de rede, pode estar desconectado ou WAHA fora do ar
      setStatus("DISCONNECTED");
    } finally {
      setIsLoading(false);
    }
  }, [hasWahaConfig, settings?.wahaApiUrl, settings?.wahaApiKey, settings?.wahaSession]);

  // Refresh das configs quando montar
  useEffect(() => {
    refreshSettings();
  }, []);

  // Verificar status quando settings mudar
  useEffect(() => {
    if (!isLoadingSettings && settings) {
      console.log("[useWahaStatus] Settings carregadas, verificando status...");
      checkStatus();
    }
  }, [isLoadingSettings, settings, checkStatus]);

  // Polling a cada 30 segundos se não estiver conectado
  useEffect(() => {
    if (status !== "CONNECTED" && status !== "NOT_CONFIGURED" && status !== "LOADING" && !isLoading) {
      const interval = setInterval(checkStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [status, isLoading, checkStatus]);

  return {
    status,
    isLoading: isLoading || isLoadingSettings,
    isConnected: status === "CONNECTED",
    refresh: checkStatus,
  };
}
