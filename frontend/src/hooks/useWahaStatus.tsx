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
  const { settings, hasWahaConfig, isLoading: isLoadingSettings } = useCompanySettings();
  const [status, setStatus] = useState<WAStatus>("LOADING");
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    // Se não tem config, retorna NOT_CONFIGURED
    if (!hasWahaConfig || !settings?.wahaApiUrl) {
      setStatus("NOT_CONFIGURED");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const sessionName = settings.wahaSession || "default";
      const url = `${settings.wahaApiUrl}/api/sessions/${sessionName}`;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (settings.wahaApiKey) {
        headers["X-Api-Key"] = settings.wahaApiKey;
      }

      const response = await fetch(url, { 
        method: "GET", 
        headers,
        // Timeout de 5 segundos
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        setStatus("DISCONNECTED");
        return;
      }

      const data = await response.json();
      
      // Mapear status do WAHA para nosso status
      const wahaStatus = data.status?.toUpperCase() || data.engine?.state?.toUpperCase();
      
      if (wahaStatus === "WORKING" || wahaStatus === "CONNECTED") {
        setStatus("CONNECTED");
      } else if (wahaStatus === "SCAN_QR_CODE" || wahaStatus === "SCANNING") {
        setStatus("SCANNING");
      } else if (wahaStatus === "STARTING") {
        setStatus("STARTING");
      } else {
        setStatus("DISCONNECTED");
      }
    } catch (error) {
      console.warn("Erro ao verificar status WAHA:", error);
      setStatus("DISCONNECTED");
    } finally {
      setIsLoading(false);
    }
  }, [hasWahaConfig, settings]);

  // Verificar status quando settings mudar
  useEffect(() => {
    if (!isLoadingSettings) {
      checkStatus();
    }
  }, [isLoadingSettings, checkStatus]);

  // Polling a cada 30 segundos se não estiver conectado
  useEffect(() => {
    if (status !== "CONNECTED" && status !== "NOT_CONFIGURED" && !isLoading) {
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
