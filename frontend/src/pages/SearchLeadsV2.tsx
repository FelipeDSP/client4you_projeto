import { useState, useEffect } from "react";
import { LeadSearch } from "@/components/LeadSearch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuotaLimitModal } from "@/components/QuotaLimitModal";
import { ConfigurationAlert } from "@/components/ConfigurationAlert";
import { useSearchSession, type SearchResult } from "@/hooks/useSearchSession";
import { useQuotas } from "@/hooks/useQuotas";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Search, Library, Loader2, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";

export default function SearchLeads() {
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();
  
  useEffect(() => {
    setPageTitle("Buscar Leads", Search);
  }, [setPageTitle]);

  const {
    session,
    results,
    isSearching,
    error,
    startSearch,
    fetchMore,
    resetSearch,
    hasMore,
    isCompleted
  } = useSearchSession();

  // Quota Management
  const { checkQuota, incrementQuota } = useQuotas();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  
  // Company Settings (SERP API)
  const { hasSerpapiKey, refreshSettings } = useCompanySettings();
  
  useEffect(() => {
    refreshSettings();
  }, []);

  const handleSearch = async (term: string, location: string) => {
    // Verificar quota antes de buscar
    const quotaCheck = await checkQuota('lead_search');
    
    if (!quotaCheck.allowed) {
      setShowQuotaModal(true);
      return;
    }
    
    // Resetar busca anterior
    resetSearch();
    
    // Iniciar nova busca (página 0)
    const response = await startSearch(term, location, 'serp');
    
    if (response) {
      // Incrementar quota após sucesso
      await incrementQuota('lead_search');
      
      if (response.new_count === 0 && response.duplicate_count === 0) {
        toast.info("Nenhum resultado encontrado para esta busca");
      } else {
        toast.success(
          `Página 1: ${response.new_count} novos leads, ${response.duplicate_count} já capturados`
        );
      }
    } else if (error) {
      toast.error(error);
    }
  };

  const handleFetchMore = async () => {
    const response = await fetchMore();
    
    if (response) {
      if (response.new_count === 0 && response.duplicate_count === 0) {
        toast.info("Não há mais resultados disponíveis nesta região");
      } else {
        toast.success(
          `Página ${session!.current_page + 1}: ${response.new_count} novos, ${response.duplicate_count} já capturados`
        );
      }
    } else if (error) {
      toast.error(error);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      toast.error("Nenhum resultado para exportar");
      return;
    }

    const exportData = results.map(result => ({
      Nome: result.name,
      Telefone: result.phone || '',
      Endereço: result.address,
      Categoria: result.category,
      'Avaliação': result.rating || '',
      'Reviews': result.reviews_count || 0,
      'Site': result.website || '',
      'Status': result.is_duplicate ? 'Já capturado' : 'Novo',
      'Vezes encontrado': result.times_found || 1
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    
    const timestamp = new Date().toISOString().split('T')[0];
    const queryName = session?.query.replace(/\s+/g, '-').toLowerCase() || 'busca';
    XLSX.writeFile(wb, `${queryName}-${timestamp}.xlsx`);
    
    toast.success(`${exportData.length} resultados exportados!`);
  };

  // Filtrar apenas novos ou apenas duplicados
  const newLeads = results.filter(r => !r.is_duplicate);
  const duplicateLeads = results.filter(r => r.is_duplicate);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Buscar Novos Leads</h2>
          <p className="text-muted-foreground mt-1">
            Encontre contatos em tempo real usando Google Maps
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate('/leads')}
        >
          <Library className="h-4 w-4 mr-2" />
          Ver Biblioteca
        </Button>
      </div>

      {/* Alert de configuração SERP API */}
      {!hasSerpapiKey && (
        <ConfigurationAlert type="serp" />
      )}

      {/* Área de Busca */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-6">
          <LeadSearch 
            onSearch={handleSearch}
            isSearching={isSearching}
            disabled={!hasSerpapiKey}
          />

          {session && (
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Resultados:</span>
                  <Badge variant="default" className="bg-green-500">
                    🆕 {session.new_leads_count} novos
                  </Badge>
                  <Badge variant="secondary">
                    🔄 {session.duplicate_leads_count} já capturados
                  </Badge>
                </div>
                
                {session.current_page > 0 && (
                  <Badge variant="outline">
                    Página {session.current_page}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {results.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportResults}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSearch}
                >
                  Nova Busca
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Resultados desta busca ({results.length})
            </h3>
            
            <div className="flex gap-2 text-sm text-gray-600">
              <span>🆕 {newLeads.length} novos</span>
              <span className="text-gray-400">|</span>
              <span>🔄 {duplicateLeads.length} já existentes</span>
            </div>
          </div>

          <div className="space-y-3">
            {results.map((result, idx) => (
              <Card 
                key={`${result.id || idx}`}
                className={`p-4 ${result.is_duplicate ? 'bg-gray-50 border-gray-200' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{result.name}</h4>
                      
                      {result.is_duplicate ? (
                        <Badge variant="secondary" className="text-xs">
                          🔄 Já capturado {result.times_found > 1 ? `${result.times_found}x` : ''}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-green-500">
                          🆕 Novo
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {result.phone && (
                        <div>📞 {result.phone}</div>
                      )}
                      
                      {result.address && (
                        <div>📍 {result.address}</div>
                      )}
                      
                      {result.category && (
                        <div>🏷️ {result.category}</div>
                      )}
                      
                      {result.rating && result.rating > 0 && (
                        <div>
                          ⭐ {result.rating.toFixed(1)} 
                          {result.reviews_count > 0 && ` (${result.reviews_count} reviews)`}
                        </div>
                      )}

                      {result.website && (
                        <div>
                          🌐 <a 
                            href={result.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline"
                          >
                            {result.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Botão Carregar Mais */}
          {hasMore && !isCompleted && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleFetchMore}
                disabled={isSearching}
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Carregar Mais 20 Resultados
                  </>
                )}
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                ✓ Busca completa. Não há mais resultados disponíveis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading inicial */}
      {isSearching && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Buscando leads...</p>
        </div>
      )}

      {/* Nenhum resultado */}
      {!isSearching && results.length === 0 && session && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhum resultado encontrado</h3>
          <p className="text-gray-500 mt-2">
            Tente buscar por outros termos ou localizações
          </p>
        </Card>
      )}

      {/* Modal de Quota */}
      <QuotaLimitModal 
        open={showQuotaModal} 
        onClose={() => setShowQuotaModal(false)} 
      />
    </div>
  );
}
