import { useState, useEffect } from "react";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadFilters, LeadFilterState, defaultFilters, filterLeads } from "@/components/LeadFilters";
import { LeadTable } from "@/components/LeadTable";
import { Card } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { QuotaLimitModal } from "@/components/QuotaLimitModal";
import { ConfigurationAlert } from "@/components/ConfigurationAlert";
import { useLeads } from "@/hooks/useLeads";
import { useQuotas } from "@/hooks/useQuotas";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Lead } from "@/types";
import { Search, ArrowDown } from "lucide-react";

export default function SearchLeads() {
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {
    setPageTitle("Buscar Leads", Search);
  }, [setPageTitle]);

  // Estado LOCAL para mostrar APENAS o que foi buscado agora
  const [currentResults, setCurrentResults] = useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estado para paginação
  const [hasMore, setHasMore] = useState(false);
  const [nextStart, setNextStart] = useState(0);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  
  const [filters, setFilters] = useState<LeadFilterState>(defaultFilters);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Quota Management
  const { quota, checkQuota, incrementQuota } = useQuotas();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  
  // Company Settings (SERP API)
  const { settings, isLoading: isLoadingSettings, hasSerpapiKey, refreshSettings } = useCompanySettings();
  const hasSerpApi = hasSerpapiKey;
  
  const { deleteLead, searchLeads, isSearching } = useLeads();

  // Refresh settings when component mounts (including navigation back)
  useEffect(() => {
    refreshSettings();
  }, []); // Empty dependency - runs on mount

  const handleSearch = async (term: string, location: string) => {
    // ✅ VERIFICAR QUOTA ANTES DE BUSCAR
    const quotaCheck = await checkQuota('lead_search');
    
    if (!quotaCheck.allowed) {
      setShowQuotaModal(true);
      return;
    }
    
    // Limpa resultados anteriores enquanto busca
    setCurrentResults([]);
    setHasSearched(true);
    setHasMore(false);
    
    // Chama o hook e espera a resposta
    const result = await searchLeads(term, location);
    
    console.log('[SearchLeads] Result from searchLeads:', result);
    
    if (result && result.leads && result.leads.length > 0) {
      setCurrentResults(result.leads);
      
      // LÓGICA INTELIGENTE: Se retornou 20 leads (limite padrão), provavelmente há mais
      const smartHasMore = result.leads.length === 20;
      const smartNextStart = result.leads.length === 20 ? 20 : 0;
      
      setHasMore(smartHasMore);
      setNextStart(smartNextStart);
      setCurrentSearchId(result.searchId);
      setCurrentQuery(result.query);
      setCurrentLocation(result.location);
      
      console.log('[SearchLeads] State updated:', {
        leadsCount: result.leads.length,
        hasMore: smartHasMore,
        nextStart: smartNextStart,
        note: 'Using smart pagination logic'
      });
      
      // ✅ INCREMENTAR QUOTA APÓS SUCESSO
      await incrementQuota('lead_search');
    }
  };

  const handleLoadMore = async () => {
    if (!currentSearchId || !hasMore) return;
    
    // Chama o hook com paginação
    const result = await searchLeads(currentQuery, currentLocation, nextStart, currentSearchId);
    
    if (result && result.leads && result.leads.length > 0) {
      // ADICIONA aos resultados existentes
      setCurrentResults(prev => [...prev, ...result.leads]);
      setHasMore(result.hasMore);
      setNextStart(result.nextStart);
    }
  };

  // Filtra apenas os resultados ATUAIS
  const filteredLeads = filterLeads(currentResults, filters);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Buscar Leads</h2>
          <p className="text-muted-foreground mt-1">
            Encontre novos contatos em tempo real.
          </p>
        </div>
        
        {currentResults.length > 0 && (
          <ExportButton 
            leads={filteredLeads} 
            selectedLeads={selectedLeads} 
          />
        )}
      </div>

      {/* Alert de configuração SERP API */}
      {!isLoadingSettings && !hasSerpApi && (
        <ConfigurationAlert type="serp" />
      )}

      {/* Área de Busca */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-6">
          <LeadSearch 
            onSearch={handleSearch}
            isSearching={isSearching}
            disabled={!hasSerpApi}
          />
          
          {currentResults.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <LeadFilters 
                leads={currentResults} 
                filters={filters} 
                onFiltersChange={setFilters} 
              />
            </div>
          )}
        </div>
      </Card>

      {/* Tabela de Resultados */}
      {hasSearched && currentResults.length > 0 && (
        <Card className="p-6 bg-white shadow-sm border-none rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead Encontrado' : 'Leads Encontrados'}
              </h3>
              {hasMore && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Há mais resultados disponíveis)
                </span>
              )}
            </div>
          </div>
          
          <LeadTable
            leads={filteredLeads}
            selectedLeads={selectedLeads}
            onSelectionChange={setSelectedLeads}
            onDelete={deleteLead}
          />
          
          {/* Botão Carregar Mais - Mais Destacado */}
          {hasMore && (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Mostrando {currentResults.length} leads. Clique para buscar mais resultados.
                </p>
              </div>
              <button
                onClick={handleLoadMore}
                disabled={isSearching}
                className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                {isSearching ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Buscando mais leads...
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-5 w-5" />
                    Carregar Mais 20 Resultados
                  </>
                )}
              </button>
            </div>
          )}
        </Card>
      )}

      {hasSearched && currentResults.length === 0 && !isSearching && (
        <Card className="p-12 bg-white shadow-sm border-none rounded-xl text-center">
          <p className="text-muted-foreground">
            Nenhum lead encontrado para essa busca. Tente outros termos.
          </p>
        </Card>
      )}

      {/* Modal de Limite */}
      <QuotaLimitModal 
        open={showQuotaModal} 
        onClose={() => setShowQuotaModal(false)}
        limitType="leads"
        currentPlan={quota?.plan_type || 'demo'}
        used={quota?.leads_used || 0}
        limit={quota?.leads_limit || 0}
      />
    </div>
  );
}
