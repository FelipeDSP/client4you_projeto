import { useState, useCallback, useEffect } from "react";
import { Lead } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LeadFilters {
  search?: string;
  category?: string;
  city?: string;
  minRating?: number;
  hasPhone?: boolean;
  hasWhatsapp?: boolean;
  hasEmail?: boolean;
  isFavorite?: boolean;
  tags?: string[];
}

export type SortOption = 
  | 'newest' 
  | 'oldest' 
  | 'most_found' 
  | 'highest_rating' 
  | 'favorites';

export function useLeadsLibrary() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const LEADS_PER_PAGE = 50;

  // Buscar leads da biblioteca
  const fetchLeads = useCallback(async (reset = false) => {
    if (!user?.companyId) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const currentPage = reset ? 0 : page;
      const from = currentPage * LEADS_PER_PAGE;
      const to = from + LEADS_PER_PAGE - 1;

      console.log(`[useLeadsLibrary] Fetching page ${currentPage} (${from}-${to})`);

      // Construir query base
      let query = supabase
        .from("leads")
        .select("*", { count: 'exact' })
        .eq("company_id", user.companyId);

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
      }

      if (filters.category) {
        query = query.ilike('category', `%${filters.category}%`);
      }

      if (filters.city) {
        query = query.ilike('address', `%${filters.city}%`);
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.hasPhone) {
        query = query.not('phone', 'is', null);
      }

      if (filters.hasWhatsapp) {
        query = query.eq('has_whatsapp', true);
      }

      if (filters.hasEmail) {
        query = query.not('email', 'is', null);
      }

      if (filters.isFavorite) {
        query = query.eq('is_favorite', true);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Aplicar ordenação
      switch (sortBy) {
        case 'newest':
          query = query.order('last_seen_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('first_seen_at', { ascending: true });
          break;
        case 'most_found':
          query = query.order('times_found', { ascending: false });
          break;
        case 'highest_rating':
          query = query.order('rating', { ascending: false, nullsLast: true });
          break;
        case 'favorites':
          query = query.eq('is_favorite', true).order('last_seen_at', { ascending: false });
          break;
      }

      // Aplicar paginação
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching leads:", error);
        setIsLoading(false);
        return;
      }

      // Mapear para tipo Lead
      const mappedLeads: Lead[] = (data || []).map((lead) => ({
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
        extractedAt: lead.last_seen_at || lead.created_at,
        searchId: lead.search_id || undefined,
        companyId: lead.company_id,
        // Novos campos
        fingerprint: lead.fingerprint,
        timesSeen: lead.times_found || 1,
        firstSeenAt: lead.first_seen_at,
        lastSeenAt: lead.last_seen_at,
        isFavorite: lead.is_favorite || false,
        tags: lead.tags || [],
      }));

      console.log(`[useLeadsLibrary] Fetched ${mappedLeads.length} leads, total: ${count}`);

      if (reset) {
        setLeads(mappedLeads);
        setPage(1);
      } else {
        setLeads(prev => [...prev, ...mappedLeads]);
        setPage(currentPage + 1);
      }

      setTotalCount(count || 0);
      setHasMore(mappedLeads.length === LEADS_PER_PAGE);
      setIsLoading(false);

    } catch (error) {
      console.error("Error in fetchLeads:", error);
      setIsLoading(false);
    }
  }, [user?.companyId, page, filters, sortBy]);

  // Aplicar novos filtros (reseta a página)
  const applyFilters = useCallback((newFilters: LeadFilters) => {
    console.log("[useLeadsLibrary] Applying filters:", newFilters);
    setFilters(newFilters);
    setPage(0);
    setLeads([]);
    setHasMore(true);
  }, []);

  // Mudar ordenação
  const changeSortBy = useCallback((newSort: SortOption) => {
    console.log("[useLeadsLibrary] Changing sort to:", newSort);
    setSortBy(newSort);
    setPage(0);
    setLeads([]);
    setHasMore(true);
  }, []);

  // Marcar/desmarcar favorito
  const toggleFavorite = useCallback(async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newFavoriteState = !lead.isFavorite;

    // Atualização otimista
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, isFavorite: newFavoriteState } : l
    ));

    // Atualizar no banco
    const { error } = await supabase
      .from('leads')
      .update({ is_favorite: newFavoriteState })
      .eq('id', leadId);

    if (error) {
      console.error("Error toggling favorite:", error);
      // Reverter em caso de erro
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, isFavorite: !newFavoriteState } : l
      ));
    }
  }, [leads]);

  // Adicionar/remover tags
  const updateTags = useCallback(async (leadId: string, newTags: string[]) => {
    // Atualização otimista
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, tags: newTags } : l
    ));

    // Atualizar no banco
    const { error } = await supabase
      .from('leads')
      .update({ tags: newTags })
      .eq('id', leadId);

    if (error) {
      console.error("Error updating tags:", error);
      // Reverter em caso de erro
      fetchLeads(true);
    }
  }, [fetchLeads]);

  // Deletar lead
  const deleteLead = useCallback(async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error("Error deleting lead:", error);
      return false;
    }

    setLeads(prev => prev.filter(l => l.id !== leadId));
    setTotalCount(prev => prev - 1);
    return true;
  }, []);

  // Limpar todos os leads da empresa
  const clearAllLeads = useCallback(async () => {
    if (!user?.companyId) return false;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('company_id', user.companyId);

    if (error) {
      console.error("Error clearing all leads:", error);
      return false;
    }

    setLeads([]);
    setTotalCount(0);
    return true;
  }, [user?.companyId]);

  // Buscar tags únicas (para filtro)
  const getAvailableTags = useCallback(async (): Promise<string[]> => {
    if (!user?.companyId) return [];

    const { data } = await supabase
      .from('leads')
      .select('tags')
      .eq('company_id', user.companyId)
      .not('tags', 'is', null);

    if (!data) return [];

    // Flatten e deduplicate
    const allTags = data.flatMap(lead => lead.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [user?.companyId]);

  // Buscar categorias únicas (para filtro)
  const getAvailableCategories = useCallback(async (): Promise<string[]> => {
    if (!user?.companyId) return [];

    const { data } = await supabase
      .from('leads')
      .select('category')
      .eq('company_id', user.companyId)
      .not('category', 'is', null)
      .order('category');

    if (!data) return [];

    const categories = data.map(lead => lead.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  }, [user?.companyId]);

  // Carregar leads ao montar (se ainda não carregou)
  useEffect(() => {
    if (leads.length === 0 && !isLoading) {
      fetchLeads(true);
    }
  }, []);

  return {
    leads,
    totalCount,
    hasMore,
    isLoading,
    filters,
    sortBy,
    fetchLeads,
    applyFilters,
    changeSortBy,
    toggleFavorite,
    updateTags,
    deleteLead,
    clearAllLeads,
    getAvailableTags,
    getAvailableCategories,
    refreshLeads: () => fetchLeads(true)
  };
}
