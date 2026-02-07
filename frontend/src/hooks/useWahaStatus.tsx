import { useState, useEffect, useCallback } from "react";
import { makeAuthenticatedRequest } from "@/lib/api";

export type WAStatus = "LOADING" | "DISCONNECTED" | "STARTING" | "SCANNING" | "CONNECTED" | "NOT_CONFIGURED";

interface UseWahaStatusResult {
  status: WAStatus;
  isLoading: boolean;
  isConnected: boolean;
  sessionName: string | null;
  refresh: () => void;
}

// Em produção usa VITE_BACKEND_URL, em dev usa URL relativa (proxy do Vite)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export function useWahaStatus(): UseWahaStatusResult {
  const [status, setStatus] = useState<WAStatus>("LOADING");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionName, setSessionName] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    console.log("[useWahaStatus] Verificando status via backend...");
    
    try {
      setIsLoading(true);

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/whatsapp/status`, {
        method: "GET"
      });

      if (!response.ok) {
        console.log("[useWahaStatus] Resposta não ok:", response.status);
        setStatus("DISCONNECTED");
        return;
      }

      const data = await response.json();
      console.log("[useWahaStatus] Resposta do backend:", data);
      
      // Salvar nome da sessão para debug
      if (data.session_name) {
        setSessionName(data.session_name);
      }
      
      // O backend já retorna o status mapeado corretamente
      const backendStatus = (data.status || "DISCONNECTED").toUpperCase();
      
      if (backendStatus === "CONNECTED") {
        setStatus("CONNECTED");
      } else if (backendStatus === "SCANNING") {
        setStatus("SCANNING");
      } else if (backendStatus === "STARTING") {
        setStatus("STARTING");
      } else if (backendStatus === "NOT_CONFIGURED") {
        setStatus("NOT_CONFIGURED");
      } else {
        setStatus("DISCONNECTED");
      }
    } catch (error: any) {
      console.warn("[useWahaStatus] Erro ao verificar:", error?.message || error);
      // Se for erro de sessão expirada, não seta como desconectado
      if (!error?.message?.includes("outro dispositivo")) {
        setStatus("DISCONNECTED");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar status ao montar o componente
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Polling a cada 30 segundos se não estiver conectado
  useEffect(() => {
    if (status !== "CONNECTED" && status !== "NOT_CONFIGURED" && status !== "LOADING" && !isLoading) {
      const interval = setInterval(checkStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [status, isLoading, checkStatus]);

  return {
    status,
    isLoading,
    isConnected: status === "CONNECTED",
    sessionName,
    refresh: checkStatus,
  };
}
