import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeAuthenticatedRequest } from "@/lib/api";

export type WAStatus = "LOADING" | "DISCONNECTED" | "STARTING" | "SCANNING" | "CONNECTED" | "NOT_CONFIGURED";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export function useWahaStatus() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['waha-status'],
    queryFn: async () => {
      console.log("[useWahaStatus] Verificando status...");
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/whatsapp/status`, { method: "GET" });
      if (!response.ok) throw new Error("Erro ao verificar status");
      return response.json();
    },
    // Lógica inteligente de Polling:
    // Se estiver 'SCANNING' ou 'STARTING', checa rápido (5s)
    // Se estiver 'CONNECTED', checa devagar (60s)
    // Se der erro, checa devagar (30s)
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase();
      if (status === 'SCANNING' || status === 'STARTING') return 5000;
      if (status === 'CONNECTED') return 60000; 
      return 30000;
    },
    refetchOnWindowFocus: "always", // Garante status real ao voltar pra aba
  });

  const status: WAStatus = data?.status ? data.status.toUpperCase() : "DISCONNECTED";
  const sessionName = data?.session_name || null;

  return {
    status: isLoading ? "LOADING" : status,
    isLoading,
    isConnected: status === "CONNECTED",
    sessionName,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['waha-status'] }),
  };
}
