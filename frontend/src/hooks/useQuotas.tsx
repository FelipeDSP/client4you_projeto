import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface UserQuota {
  id: string;
  user_id: string;
  company_id: string;
  plan_type: 'demo' | 'free' | 'pro' | 'enterprise';
  plan_name: string;
  leads_limit: number;
  leads_used: number;
  campaigns_limit: number;
  campaigns_used: number;
  messages_limit: number;
  messages_sent: number;
  reset_date: string;
  plan_expires_at?: string;
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
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching quota for user:', user.id);
      const response = await makeAuthenticatedRequest(`${API_URL}/api/quotas/me`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Quota fetched:', data);
        setQuota(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Error fetching quota:', response.status, errorText);
        setError(`Erro ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error fetching quota:", error);
      if (error.message?.includes("Sessão expirada")) {
        setError('Sessão expirada');
      } else {
        setError('Erro de conexão');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const checkQuota = useCallback(async (action: 'lead_search' | 'campaign_send' | 'message_send'): Promise<QuotaCheckResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Usuário não autenticado' };
    }

    try {
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
  }, [user?.id]);

  const incrementQuota = useCallback(async (action: 'lead_search' | 'campaign_send' | 'message_send', amount: number = 1): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/quotas/increment`,
        {
          method: 'POST',
          body: JSON.stringify({ action, amount })
        }
      );
      
      if (response.ok) {
        // Refresh quota after increment
        await fetchQuota();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error incrementing quota:", error);
      return false;
    }
  }, [user?.id, fetchQuota]);

  const refresh = useCallback(() => {
    fetchQuota();
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
