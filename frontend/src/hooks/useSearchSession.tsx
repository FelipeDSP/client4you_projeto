import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SearchSession {
  id: string;
  company_id: string;
  user_id: string;
  search_type: 'serp' | 'cnae';
  query: string;
  location?: string;
  current_page: number;
  new_leads_count: number;
  duplicate_leads_count: number;
  total_results_found: number;
  status: 'active' | 'completed' | 'error';
  has_more: boolean;
}

export interface SearchResult {
  id: string;
  name: string;
  phone?: string;
  address: string;
  category: string;
  rating?: number;
  reviews_count: number;
  website?: string;
  is_duplicate: boolean;
  times_found: number;
}

export interface SearchResponse {
  session_id: string;
  results: SearchResult[];
  new_count: number;
  duplicate_count: number;
  current_page: number;
  has_more: boolean;
  total_new: number;
  total_duplicates: number;
  status?: string;
}

export function useSearchSession() {
  const { user } = useAuth();
  const [session, setSession] = useState<SearchSession | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Criar nova busca
  const startSearch = useCallback(async (
    query: string, 
    location: string,
    searchType: 'serp' | 'cnae' = 'serp'
  ): Promise<SearchResponse | null> => {
    if (!user?.companyId) {
      setError("No company ID found");
      return null;
    }

    setIsSearching(true);
    setError(null);
    setResults([]); // Limpar resultados anteriores

    try {
      console.log(`[useSearchSession] Starting new search: "${query}" in "${location}"`);

      // Obter token de autenticação
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.access_token) {
        setError("No authentication token");
        setIsSearching(false);
        return null;
      }

      console.log('[useSearchSession] Calling backend API /api/leads/search');
      
      // Chamar o backend
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const formData = new FormData();
      formData.append('query', query);
      formData.append('location', location);
      formData.append('start', '0');
      
      const response = await fetch(`${backendUrl}/api/leads/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to search leads');
      }

      const data = await response.json();
      
      console.log('[useSearchSession] Backend response:', data);

      if (data?.error) {
        console.error("Search error:", data.error);
        setError(data.error);
        setIsSearching(false);
        return null;
      }

      console.log(`[useSearchSession] Search completed:`, {
        new: data.new_count,
        duplicates: data.duplicate_count,
        has_more: data.has_more,
        results_count: data.results?.length || 0
      });

      console.log('[useSearchSession] Full response data:', data);

      // Atualizar estado
      setResults(data.results || []);
      console.log('[useSearchSession] Results set, length:', data.results?.length || 0);
      setSession({
        id: data.session_id,
        company_id: user.companyId,
        user_id: user.id,
        search_type: searchType,
        query,
        location,
        current_page: data.current_page,
        new_leads_count: data.total_new || data.new_count,
        duplicate_leads_count: data.total_duplicates || data.duplicate_count,
        total_results_found: (data.total_new || data.new_count) + (data.total_duplicates || data.duplicate_count),
        status: data.status === 'completed' ? 'completed' : 'active',
        has_more: data.has_more
      });

      setIsSearching(false);
      return data;

    } catch (err: any) {
      console.error("Unexpected error in startSearch:", err);
      setError(err.message || "Unexpected error");
      setIsSearching(false);
      return null;
    }
  }, [user]);

  // Buscar mais resultados (próxima página)
  const fetchMore = useCallback(async (): Promise<SearchResponse | null> => {
    if (!session) {
      setError("No active search session");
      return null;
    }

    if (session.status === 'completed') {
      console.log("[useSearchSession] Session already completed, no more results");
      return null;
    }

    setIsSearching(true);
    setError(null);

    try {
      console.log(`[useSearchSession] Fetching more results for session ${session.id}, page ${session.current_page + 1}`);

      // Obter token
      const { data: { session: authSession } } = await supabase.auth.getSession();

      // Chamar Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('search-leads-v2', {
        body: {
          action: 'fetch_more',
          session_id: session.id
        },
        headers: authSession?.access_token 
          ? { Authorization: `Bearer ${authSession.access_token}` }
          : undefined,
      });

      if (invokeError) {
        console.error("Error fetching more results:", invokeError);
        setError(invokeError.message || "Failed to fetch more results");
        setIsSearching(false);
        return null;
      }

      if (data?.error) {
        console.error("Fetch more error:", data.error);
        setError(data.error);
        setIsSearching(false);
        return null;
      }

      console.log(`[useSearchSession] Fetched ${data.results?.length || 0} more results:`, {
        new: data.new_count,
        duplicates: data.duplicate_count,
        has_more: data.has_more
      });

      // Adicionar novos resultados aos existentes
      setResults(prev => [...prev, ...(data.results || [])]);
      
      // Atualizar sessão
      setSession(prev => prev ? {
        ...prev,
        current_page: data.current_page,
        new_leads_count: data.total_new,
        duplicate_leads_count: data.total_duplicates,
        total_results_found: data.total_new + data.total_duplicates,
        status: data.status === 'completed' ? 'completed' : 'active',
        has_more: data.has_more
      } : null);

      setIsSearching(false);
      return data;

    } catch (err: any) {
      console.error("Unexpected error in fetchMore:", err);
      setError(err.message || "Unexpected error");
      setIsSearching(false);
      return null;
    }
  }, [session]);

  // Resetar busca
  const resetSearch = useCallback(() => {
    setSession(null);
    setResults([]);
    setError(null);
  }, []);

  return {
    session,
    results,
    isSearching,
    error,
    startSearch,
    fetchMore,
    resetSearch,
    hasMore: session?.has_more || false,
    isCompleted: session?.status === 'completed'
  };
}
