import { useState, useEffect } from "react";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadFilters, LeadFilterState, defaultFilters, filterLeads } from "@/components/LeadFilters";
import { LeadTable } from "@/components/LeadTable";
import { Card } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { QuotaLimitModal } from "@/components/QuotaLimitModal";
import { useLeads } from "@/hooks/useLeads";
import { useQuotas } from "@/hooks/useQuotas";
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
  const [hasSearched, setHasSearched] = useState(false); // Para saber se já buscou alguma vez
  
  const [filters, setFilters] = useState<LeadFilterState>(defaultFilters);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Quota Management
  const { quota, checkQuota, incrementQuota } = useQuotas();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  
  const { deleteLead, searchLeads, isSearching } = useLeads();

  // Função Wrapper para capturar o resultado e colocar no estado local
  const handleSearch = async (term: string, location: string) => {
    // ✅ VERIFICAR QUOTA ANTES DE BUSCAR
    const quotaCheck = await checkQuota('lead_search');
    
    if (!quotaCheck.allowed) {
      // Mostrar modal de limite atingido
      setShowQuotaModal(true);
      return;
    }
    
    // Limpa resultados anteriores enquanto busca
    setCurrentResults([]);
    setHasSearched(true);
    
    // Chama o hook e espera a resposta
    const newLeads = await searchLeads(term, location);
    
    if (newLeads && newLeads.length > 0) {
      setCurrentResults(newLeads);
      // ✅ INCREMENTAR QUOTA APÓS SUCESSO
      await incrementQuota('lead_search');
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
        
        {/* Só mostra botão de exportar se tiver resultados na tela */}
        {currentResults.length > 0 && (
          <ExportButton 
            leads={filteredLeads} 
            selectedLeads={selectedLeads} 
          />
        )}
      </div>

      {/* Área de Busca */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-6">
          <LeadSearch 
            onSearch={handleSearch} // Usamos nosso handler local
            isSearching={isSearching} 
          />
          
          {/* Só mostra filtros se já tiver feito uma busca com sucesso */}
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

      {/* Área de Resultados (Condicional) */}
      {!hasSearched && !isSearching ? (
        // ESTADO 1: Nada pesquisado ainda (Empty State Bonito)
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <Search className="h-8 w-8 text-primary/40" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Pronto para buscar?</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Digite um termo (ex: "Pizzarias") e uma localização acima para começar a mineração de leads.
          </p>
        </div>
      ) : (
        // ESTADO 2: Mostra Tabela (Vazia se carregando ou com dados)
        <Card className="bg-white shadow-sm border-none rounded-xl overflow-hidden min-h-[200px] relative">
          {isSearching && (
            <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm font-medium text-primary animate-pulse">Minerando dados do Google Maps...</p>
              <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos</p>
            </div>
          )}

          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              Resultados da Sessão
              {hasSearched && !isSearching && (
                <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                  {filteredLeads.length} encontrados agora
                </span>
              )}
            </h3>
          </div>
          
          <LeadTable 
            leads={filteredLeads} 
            onDelete={deleteLead} 
            selectedLeads={selectedLeads}
            onSelectionChange={setSelectedLeads}
          />
        </Card>
      )}
      
      {/* Modal de Limite de Quota */}
      {quota && (
        <QuotaLimitModal
          open={showQuotaModal}
          onClose={() => setShowQuotaModal(false)}
          limitType="leads"
          currentPlan={quota.plan_type}
          used={quota.leads_used}
          limit={quota.leads_limit}
        />
      )}
    </div>
  );
}