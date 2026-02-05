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
import { Search, ArrowDown, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Corrigido import do Toast

export default function SearchLeads() {
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {
    setPageTitle("Buscar Leads", Search);
  }, [setPageTitle]);

  const [currentResults, setCurrentResults] = useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estado de Validação (NOVO)
  const [isValidating, setIsValidating] = useState(false);
  
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
  
  // IMPORTANTE: validateLeads adicionado aqui
  const { deleteLead, searchLeads, isSearching, validateLeads } = useLeads();
  const { toast } = useToast();

  useEffect(() => {
    refreshSettings();
  }, []);

  // --- NOVA FUNÇÃO: Valida leads e atualiza a UI ---
  const handleValidation = async (leadsToValidate: Lead[]) => {
    if (leadsToValidate.length === 0) return;
    
    setIsValidating(true);
    // Extrai apenas os IDs para enviar ao backend
    const ids = leadsToValidate.map(l => l.id);
    
    // Chama o hook que conecta ao backend
    const updated = await validateLeads(ids);
    
    if (updated && updated.length > 0) {
      // Atualiza a lista atual com os badges de WhatsApp (mescla com o estado anterior)
      setCurrentResults(prev => prev.map(lead => {
        const isUpdated = updated.find((u: any) => u.id === lead.id);
        // Se foi atualizado pelo backend como "tem whats", marca como true
        return isUpdated ? { ...lead, hasWhatsApp: true } : lead;
      }));
      
      toast({
        title: "Validação concluída",
        description: `${updated.length} números com WhatsApp identificados.`,
        className: "border-l-4 border-green-500"
      });
    }
    setIsValidating(false);
  };

  const handleSearch = async (term: string, location: string) => {
    const quotaCheck = await checkQuota('lead_search');
    
    if (!quotaCheck.allowed) {
      setShowQuotaModal(true);
      return;
    }
    
    setCurrentResults([]);
    setHasSearched(true);
    setHasMore(false);
    setIsValidating(false); // Reseta estado de validação
    
    const result = await searchLeads(term, location);
    
    console.log('[SearchLeads] Result from searchLeads:', result);
    
    if (result && result.leads && result.leads.length > 0) {
      setCurrentResults(result.leads);
      
      const smartHasMore = result.leads.length === 20;
      const smartNextStart = result.leads.length === 20 ? 20 : 0;
      
      setHasMore(smartHasMore);
      setNextStart(smartNextStart);
      setCurrentSearchId(result.searchId);
      setCurrentQuery(result.query);
      setCurrentLocation(result.location);
      
      await incrementQuota('lead_search');

      // 🔥 CHAMA A VALIDAÇÃO AUTOMÁTICA AQUI (para os primeiros 20)
      handleValidation(result.leads);
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

      // 🔥 VALIDA TAMBÉM OS NOVOS RESULTADOS (para os próximos 20)
      handleValidation(uniqueNewLeads);
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
              
              {/* STATUS DA VALIDAÇÃO (Visual Feedback) */}
              {isValidating ? (
                <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse ml-2 border border-orange-100">
                  <Loader2 className="h-3 w-3 animate-spin" /> Validando WhatsApp...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full ml-2 border border-green-100 transition-all duration-500 animate-in fade-in">
                  <CheckCircle2 className="h-3 w-3" /> Validação Concluída
                </span>
              )}
              
              {hasMore && (
                <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
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
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando {currentResults.length} leads. Clique para buscar mais resultados.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(currentResults.length / 20) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                    ))}
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Próxima: Página {Math.ceil(currentResults.length / 20) + 1}
                  </span>
                </div>
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
                    Carregar Próximos 20 Resultados
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                ℹ️ Cada busca retorna leads únicos, sem repetição
              </p>
            </div>
          )}
          
          {!hasMore && currentResults.length >= 20 && (
            <div className="mt-6 py-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                ✓ Todos os resultados disponíveis foram carregados ({currentResults.length} leads)
              </p>
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