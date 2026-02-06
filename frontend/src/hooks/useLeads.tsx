import { useState, useEffect, useCallback } from "react";
import { Lead, SearchHistory } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leads and history from Supabase
  const fetchData = useCallback(async () => {
    if (!user?.companyId) {
      setLeads([]);
      setSearchHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
      } else {
        const mappedLeads: Lead[] = (leadsData || []).map((lead) => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone || "",
          hasWhatsApp: lead.has_whatsapp || false,
          email: lead.email,
          hasEmail: lead.has_email || false,
          address: lead.address || "",
          city: "",
          state: "",
          rating: Number(lead.rating) || 0,
          reviews: lead.reviews_count || 0,
          category: lead.category || "",
          website: lead.website,
          extractedAt: lead.created_at,
          searchId: lead.search_id || undefined,
          companyId: lead.company_id,
        }));
        setLeads(mappedLeads);
      }

      const { data: historyData, error: historyError } = await supabase
        .from("search_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (historyError) {
        console.error("Error fetching history:", historyError);
      } else {
        const mappedHistory: SearchHistory[] = (historyData || []).map((h) => ({
          id: h.id,
          query: h.query,
          location: h.location,
          resultsCount: h.results_count || 0,
          searchedAt: h.created_at,
          userId: h.user_id || undefined,
          companyId: h.company_id,
        }));
        setSearchHistory(mappedHistory);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  interface SearchResult {
    leads: Lead[];
    hasMore: boolean;
    nextStart: number;
    searchId: string;
    query: string;
    location: string;
  }

  const searchLeads = async (query: string, location: string, start: number = 0, existingSearchId?: string): Promise<SearchResult | null> => {
    if (!user?.companyId) {
      console.error("No company ID found");
      return null;
    }

    setIsSearching(true);

    try {
      let searchId = existingSearchId;

      if (!searchId) {
        const { data: historyData, error: historyError } = await supabase
          .from("search_history")
          .insert({
            query,
            location,
            results_count: 0,
            company_id: user.companyId,
            user_id: user.id,
          })
          .select()
          .single();

        if (historyError) {
          console.error("Error creating search history:", historyError);
          setIsSearching(false);
          return null;
        }
        searchId = historyData.id;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke("search-leads", {
        body: {
          query,
          location,
          companyId: user.companyId,
          searchId,
          start,
        },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) {
        console.error("Error calling search-leads function:", error);
        setIsSearching(false);
        return null;
      }

      if (data?.error) {
        console.error("Search error:", data.error);
        setIsSearching(false);
        return null;
      }

      const { data: newLeadsData, error: newLeadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("search_id", searchId)
        .order("created_at", { ascending: false })
        .limit(data?.count || 20);

      if (newLeadsError) {
        console.error("Error fetching new leads:", newLeadsError);
        setIsSearching(false);
        return null;
      }

      const newLeads: Lead[] = (newLeadsData || []).map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone || "",
        hasWhatsApp: lead.has_whatsapp || false,
        email: lead.email,
        hasEmail: lead.has_email || false,
        address: lead.address || "",
        city: "",
        state: "",
        rating: Number(lead.rating) || 0,
        reviews: lead.reviews_count || 0,
        category: lead.category || "",
        website: lead.website,
        extractedAt: lead.created_at,
        searchId: lead.search_id || undefined,
        companyId: lead.company_id,
      }));

      await fetchData();
      setIsSearching(false);
      
      return {
        leads: newLeads,
        hasMore: data?.hasMore || false,
        nextStart: data?.nextStart || 0,
        searchId: searchId!,
        query,
        location,
      };
    } catch (error) {
      console.error("Error in searchLeads:", error);
      setIsSearching(false);
      return null;
    }
  };

  // 🔥 NOVA FUNÇÃO RESTAURADA: Conecta com o backend Python para validar 🔥
  const validateLeads = async (leadIds: string[]) => {
    if (leadIds.length === 0) return [];

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${backendUrl}/api/leads/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ lead_ids: leadIds }),
      });

      if (!response.ok) {
        console.warn("Validation endpoint error:", response.status);
        return [];
      }

      const data = await response.json();
      
      // Atualiza o estado local imediatamente
      if (data.updated && data.updated.length > 0) {
        setLeads(prev => prev.map(lead => {
          const update = data.updated.find((u: any) => u.id === lead.id);
          if (update) {
            return { ...lead, hasWhatsApp: true };
          }
          return lead;
        }));
        return data.updated;
      }
      return [];
    } catch (error) {
      console.error("Error validating leads:", error);
      return [];
    }
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { console.error("Error deleting lead:", error); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const clearAllLeads = async () => {
    if (!user?.companyId) return;
    const { error } = await supabase.from("leads").delete().eq("company_id", user.companyId);
    if (error) { console.error("Error clearing leads:", error); return; }
    setLeads([]);
  };

  const getLeadsBySearchId = (searchId: string): Lead[] => {
    return leads.filter((l) => l.searchId === searchId);
  };

  const deleteSearchHistory = async (searchId: string) => {
    await supabase.from("leads").delete().eq("search_id", searchId);
    await supabase.from("search_history").delete().eq("id", searchId);
    setSearchHistory((prev) => prev.filter((h) => h.id !== searchId));
    setLeads((prev) => prev.filter((l) => l.searchId !== searchId));
  };

  const clearAllHistory = async () => {
    if (!user?.companyId) return;
    await supabase.from("leads").delete().eq("company_id", user.companyId);
    await supabase.from("search_history").delete().eq("company_id", user.companyId);
    setSearchHistory([]);
    setLeads([]);
  };

  return {
    leads,
    searchHistory,
    isSearching,
    isLoading,
    searchLeads,
    validateLeads, // 🔥 EXPORTAR A FUNÇÃO
    deleteLead,
    clearAllLeads,
    getLeadsBySearchId,
    deleteSearchHistory,
    clearAllHistory,
    refreshData: fetchData,
  };
}