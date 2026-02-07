import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface UserQuota {
  id: string;
  user_id: string;
  company_id: string;
  plan_type: 'basico' | 'intermediario' | 'avancado' | 'suspended';
  plan_name: string;
  leads_limit: number;
  leads_used: number;
  campaigns_limit: number;
  campaigns_used: number;
  messages_limit: number;
  messages_sent: number;
  reset_date: string;
  plan_expires_at?: string;
  subscription_status?: 'active' | 'suspended' | 'canceled' | 'inactive';
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  used?: number;
  limit?: number;
  unlimited?: boolean;
  plan_type?: string;
}

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

// Cache global para quotas (compartilhado entre instâncias do hook)
const quotaCache: {
  data: UserQuota | null;
  timestamp: number;
  userId: string | null;
} = {
  data: null,
  timestamp: 0,
  userId: null
};

// Tempo de cache: 60 segundos
const CACHE_TTL = 60 * 1000;

// Helper function for authenticated requests
async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      throw new Error("Erro ao obter sessão. Tente fazer login novamente.");
    }
    
    if (!session?.access_token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      }
    });
  } catch (error: any) {
    console.error("makeAuthenticatedRequest error:", error);
    throw error;
  }
}

export function useQuotas() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<UserQuota | null>(quotaCache.data);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchQuota = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Verificar cache (se não forçar refresh)
    if (!forceRefresh && quotaCache.userId === user.id && quotaCache.data) {
      const now = Date.now();
      if (now - quotaCache.timestamp < CACHE_TTL) {
        console.log('[useQuotas] Usando cache');
        setQuota(quotaCache.data);
        setIsLoading(false);
        return;
      }
    }

    // Evitar chamadas duplicadas
    if (isFetchingRef.current) {
      console.log('[useQuotas] Já está buscando, ignorando...');
      return;
    }

    try {
      isFetchingRef.current = true;
      console.log('[useQuotas] Buscando quota do servidor...');
      const response = await makeAuthenticatedRequest(`${API_URL}/api/quotas/me`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[useQuotas] Quota recebida:', data);
        
        // Atualizar cache global
        quotaCache.data = data;
        quotaCache.timestamp = Date.now();
        quotaCache.userId = user.id;
        
        setQuota(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('[useQuotas] Erro:', response.status, errorText);
        setError(`Erro ${response.status}`);
      }
    } catch (error: any) {
      console.error("[useQuotas] Error:", error);
      if (error.message?.includes("Sessão expirada")) {
        setError('Sessão expirada');
      } else {
        setError('Erro de conexão');
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.id]);

  const checkQuota = useCallback(async (action: 'lead_search' | 'campaign_send' | 'message_send'): Promise<QuotaCheckResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Usuário não autenticado' };
    }

    try {
      // Verificar localmente se é ilimitado ANTES de chamar API
      if (quota) {
        let limit = 0;
        let used = 0;
        
        if (action === 'lead_search') {
          limit = quota.leads_limit;
          used = quota.leads_used;
        } else if (action === 'campaign_send') {
          limit = quota.campaigns_limit;
          used = quota.campaigns_used;
        } else if (action === 'message_send') {
          limit = quota.messages_limit;
          used = quota.messages_sent;
        }
        
        // -1 = Ilimitado
        if (limit === -1) {
          console.log(`Quota check: ${action} is UNLIMITED`);
          return { 
            allowed: true, 
            unlimited: true,
            used,
            limit: -1
          };
        }
      }
      
      // Backend espera action como query parameter
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/quotas/check?action=${action}`,
        {
          method: 'POST'
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('Quota check result:', result);
        
        // Se backend retornar limit -1, também tratar como ilimitado
        if (result.limit === -1) {
          return { ...result, allowed: true, unlimited: true };
        }
        
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Quota check failed:', errorData);
        return { allowed: false, reason: errorData.detail || 'Erro ao verificar quota' };
      }
    } catch (error) {
      console.error("Error checking quota:", error);
      return { allowed: false, reason: 'Erro de conexão' };
    }
  }, [user?.id, quota]);

  const incrementQuota = useCallback(async (action: 'lead_search' | 'campaign_send' | 'message_send', amount: number = 1): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Backend espera action e amount como query parameters
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/quotas/increment?action=${action}&amount=${amount}`,
        {
          method: 'POST'
        }
      );
      
      if (response.ok) {
        // Forçar refresh do cache após incremento
        await fetchQuota(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error incrementing quota:", error);
      return false;
    }
  }, [user?.id, fetchQuota]);

  const refresh = useCallback(() => {
    // Forçar refresh ignorando cache
    fetchQuota(true);
  }, [fetchQuota]);

  // Helper functions
  const hasUnlimitedLeads = quota?.leads_limit === -1;
  const hasUnlimitedCampaigns = quota?.campaigns_limit === -1;
  const canUseCampaigns = quota ? quota.campaigns_limit !== 0 : false;
  
  const leadsPercentage = quota && !hasUnlimitedLeads
    ? Math.min((quota.leads_used / quota.leads_limit) * 100, 100)
    : 0;

  const isPlanExpired = quota?.plan_expires_at 
    ? new Date(quota.plan_expires_at) < new Date()
    : false;

  useEffect(() => {
    if (user?.id) {
      console.log("[useQuotas] User logged in, fetching quota...", user.id);
      fetchQuota();
    } else {
      console.log("[useQuotas] No user, skipping quota fetch");
      setIsLoading(false);
    }
  }, [user?.id, fetchQuota]);

  return {
    quota,
    isLoading,
    error,
    checkQuota,
    incrementQuota,
    refresh,
    // Helper values
    hasUnlimitedLeads,
    hasUnlimitedCampaigns,
    canUseCampaigns,
    leadsPercentage,
    isPlanExpired
  };
}
