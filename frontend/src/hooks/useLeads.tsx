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
      // Fetch leads
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

      // Fetch search history
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

  // Resultado da busca com informações de paginação
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

      // Se não tem searchId existente, cria novo histórico
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

      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();

      // Call Edge Function with pagination
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
        return [];
      }

      if (data?.error) {
        console.error("Search error:", data.error);
        setIsSearching(false);
        return [];
      }

      // Fetch the newly inserted leads directly from database
      const { data: newLeadsData, error: newLeadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("search_id", historyData.id);

      if (newLeadsError) {
        console.error("Error fetching new leads:", newLeadsError);
        setIsSearching(false);
        return [];
      }

      // Map the new leads
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

      // Refresh all data to update the UI
      await fetchData();

      setIsSearching(false);
      return newLeads;
    } catch (error) {
      console.error("Error in searchLeads:", error);
      setIsSearching(false);
      return [];
    }
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Error deleting lead:", error);
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const clearAllLeads = async () => {
    if (!user?.companyId) return;

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("company_id", user.companyId);

    if (error) {
      console.error("Error clearing leads:", error);
      return;
    }
    setLeads([]);
  };

  const getLeadsBySearchId = (searchId: string): Lead[] => {
    return leads.filter((l) => l.searchId === searchId);
  };

  const deleteSearchHistory = async (searchId: string) => {
    // Delete associated leads first
    await supabase.from("leads").delete().eq("search_id", searchId);

    // Delete search history
    const { error } = await supabase.from("search_history").delete().eq("id", searchId);

    if (error) {
      console.error("Error deleting search history:", error);
      return;
    }

    setSearchHistory((prev) => prev.filter((h) => h.id !== searchId));
    setLeads((prev) => prev.filter((l) => l.searchId !== searchId));
  };

  const clearAllHistory = async () => {
    if (!user?.companyId) return;

    // Delete all leads with searchId
    await supabase
      .from("leads")
      .delete()
      .eq("company_id", user.companyId);

    // Delete all search history
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("company_id", user.companyId);

    if (error) {
      console.error("Error clearing history:", error);
      return;
    }

    setSearchHistory([]);
    setLeads([]);
  };

  return {
    leads,
    searchHistory,
    isSearching,
    isLoading,
    searchLeads,
    deleteLead,
    clearAllLeads,
    getLeadsBySearchId,
    deleteSearchHistory,
    clearAllHistory,
    refreshData: fetchData,
  };
}
