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

  const searchLeads = async (query: string, location: string): Promise<Lead[]> => {
    if (!user?.companyId) {
      console.error("No company ID found");
      return [];
    }

    setIsSearching(true);

    try {
      // Create search history entry
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
        return [];
      }

      // TODO: Integrate with real API (SerpAPI) via Edge Function
      // For now, simulate with mock data
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockCount = Math.floor(10 + Math.random() * 20);
      const mockLeadsData = generateMockLeadsForDB(query, location, mockCount, user.companyId, historyData.id);

      // Insert leads into database
      const { data: insertedLeads, error: leadsError } = await supabase
        .from("leads")
        .insert(mockLeadsData)
        .select();

      if (leadsError) {
        console.error("Error inserting leads:", leadsError);
        setIsSearching(false);
        return [];
      }

      // Update search history with results count
      await supabase
        .from("search_history")
        .update({ results_count: insertedLeads?.length || 0 })
        .eq("id", historyData.id);

      // Refresh data
      await fetchData();

      const newLeads: Lead[] = (insertedLeads || []).map((lead) => ({
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

// Helper function to generate mock leads for database insertion
function generateMockLeadsForDB(
  query: string,
  location: string,
  count: number,
  companyId: string,
  searchId: string
) {
  const categories = [query, `${query} Premium`, `${query} Express`];
  const streets = ["Rua das Flores", "Av. Brasil", "Rua São Paulo", "Av. Paulista", "Rua Augusta"];

  return Array.from({ length: count }, (_, i) => {
    const hasWhatsApp = Math.random() > 0.3;
    const hasEmail = Math.random() > 0.4;

    return {
      name: `${query} ${location} #${i + 1}`,
      phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      has_whatsapp: hasWhatsApp,
      email: hasEmail ? `contato${i + 1}@empresa.com.br` : null,
      has_email: hasEmail,
      address: `${streets[Math.floor(Math.random() * streets.length)]}, ${Math.floor(100 + Math.random() * 2000)} - ${location}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
      reviews_count: Math.floor(10 + Math.random() * 500),
      website: Math.random() > 0.5 ? `https://www.empresa${i + 1}.com.br` : null,
      company_id: companyId,
      search_id: searchId,
    };
  });
}
