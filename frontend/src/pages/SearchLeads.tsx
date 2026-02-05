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
  
  const { quota, checkQuota, incrementQuota } = useQuotas();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  
  const { settings, isLoading: isLoadingSettings, hasSerpapiKey, refreshSettings } = useCompanySettings();
  const hasSerpApi = hasSerpapiKey;
  
  // Voltamos ao básico: apenas searchLeads
  const { deleteLead, searchLeads, isSearching } = useLeads();

  useEffect(() => {
    refreshSettings();
  }, []);

  const handleSearch = async (term: string, location: string) => {
    const quotaCheck = await checkQuota('lead_search');
    
    if (!quotaCheck.allowed) {
      setShowQuotaModal(true);
      return;
    }
    
    setCurrentResults([]);
    setHasSearched(true);
    setHasMore(false);
    
    const result = await searchLeads(term, location);
    
    if (result && result.leads && result.leads.length > 0) {
      // Os leads já vêm validados do backend!
      setCurrentResults(result.leads);
      
      const smartHasMore = result.leads.length === 20;
      const smartNextStart = result.leads.length === 20 ? 20 : 0;
      
      setHasMore(smartHasMore);
      setNextStart(smartNextStart);
      setCurrentSearchId(result.searchId);
      setCurrentQuery(result.query);
      setCurrentLocation(result.location);
      
      await incrementQuota('lead_search');
    }
  };

  const handleLoadMore = async () => {
    if (!currentSearchId || !hasMore) return;
    
    const result = await searchLeads(currentQuery, currentLocation, nextStart, currentSearchId);
    
    if (result && result.leads && result.leads.length > 0) {
      const existingIds = new Set(currentResults.map(r => r.id));
      const uniqueNewLeads = result.leads.filter(r => !existingIds.has(r.id));
      
      setCurrentResults(prev => [...prev, ...uniqueNewLeads]);
      
      const smartHasMore = result.leads.length === 20;
      const smartNextStart = nextStart + result.leads.length;
      
      setHasMore(smartHasMore);
      setNextStart(smartNextStart);
    } else {
      setHasMore(false);
    }
  };

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

      {!isLoadingSettings && !hasSerpApi && (
        <ConfigurationAlert type="serp" />
      )}

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
            
            {currentResults.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">
                  Página {Math.ceil(currentResults.length / 20)}
                </span>
                <span>•</span>
                <span>
                  {currentResults.length} leads carregados
                </span>
              </div>
            )}
          </div>
          
          <LeadTable
            leads={filteredLeads}
            selectedLeads={selectedLeads}
            onSelectionChange={setSelectedLeads}
            onDelete={deleteLead}
          />
          
          {hasMore && (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 border-t">
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
                    Carregar Próximos 20 Resultados
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
            Nenhum lead encontrado para essa busca.
          </p>
        </Card>
      )}

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