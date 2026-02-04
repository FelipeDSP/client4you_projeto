import { useState, useEffect, useMemo } from "react";
import { LeadSearch } from "@/components/LeadSearch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuotaLimitModal } from "@/components/QuotaLimitModal";
import { ConfigurationAlert } from "@/components/ConfigurationAlert";
import { LeadCardSkeletonList } from "@/components/LeadCardSkeleton";
import { useSearchSession, type SearchResult } from "@/hooks/useSearchSession";
import { useQuotas } from "@/hooks/useQuotas";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { 
  Search, 
  Library, 
  Loader2, 
  Download, 
  Plus,
  Phone,
  MapPin,
  Globe,
  Star,
  Copy,
  ExternalLink,
  Heart,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type FilterType = 'all' | 'new' | 'duplicate';

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
  
  // Filtro
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Favoritos locais (para feedback imediato)
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    refreshSettings();
  }, []);

  const handleSearch = async (term: string, location: string) => {
    console.log('[SearchLeadsV2] handleSearch called:', { term, location });
    
    // Verificar quota antes de buscar
    console.log('[SearchLeadsV2] Checking quota...');
    const quotaCheck = await checkQuota('lead_search');
    console.log('[SearchLeadsV2] Quota check result:', quotaCheck);
    
    if (!quotaCheck.allowed) {
      console.log('[SearchLeadsV2] Quota not allowed, showing modal');
      setShowQuotaModal(true);
      return;
    }
    
    // Resetar busca anterior
    console.log('[SearchLeadsV2] Resetting previous search...');
    resetSearch();
    
    // Iniciar nova busca (página 0)
    console.log('[SearchLeadsV2] Starting new search...');
    const response = await startSearch(term, location, 'serp');
    console.log('[SearchLeadsV2] Search response:', response);
    
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
    if (filteredResults.length === 0) {
      toast.error("Nenhum resultado para exportar");
      return;
    }

    const exportData = filteredResults.map(result => ({
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

  // Copiar telefone
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success("Telefone copiado!");
  };

  // Toggle favorito
  const handleToggleFavorite = async (lead: SearchResult) => {
    try {
      const isFavorite = localFavorites.has(lead.id);
      
      // Atualizar no banco
      const { error } = await supabase
        .from('leads')
        .update({ is_favorite: !isFavorite })
        .eq('id', lead.id);

      if (error) throw error;

      // Atualizar estado local
      setLocalFavorites(prev => {
        const newSet = new Set(prev);
        if (isFavorite) {
          newSet.delete(lead.id);
          toast.success("Removido dos favoritos");
        } else {
          newSet.add(lead.id);
          toast.success("Adicionado aos favoritos!");
        }
        return newSet;
      });
    } catch (err) {
      toast.error("Erro ao atualizar favorito");
      console.error(err);
    }
  };

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    if (filter === 'new') {
      return results.filter(r => !r.is_duplicate);
    } else if (filter === 'duplicate') {
      return results.filter(r => r.is_duplicate);
    }
    return results;
  }, [results, filter]);

  // Estatísticas
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
              <div className="flex-1 flex items-center gap-3 flex-wrap">
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      📄 Página {session.current_page + 1} • {results.length} leads carregados
                    </Badge>
                  </div>
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

      {/* Filtros e Resultados */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Todos ({results.length})
                </Button>
                <Button
                  variant={filter === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('new')}
                  className={filter === 'new' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  🆕 Novos ({newLeads.length})
                </Button>
                <Button
                  variant={filter === 'duplicate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('duplicate')}
                >
                  🔄 Já Capturados ({duplicateLeads.length})
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Mostrando {filteredResults.length} de {results.length} leads
            </div>
          </div>

          {/* Lista de Leads - Cards Melhorados */}
          <div className="space-y-3">
            {filteredResults.map((result, idx) => {
              const isFavorite = localFavorites.has(result.id);
              
              return (
                <Card 
                  key={`${result.id || idx}`}
                  className={`p-5 transition-all hover:shadow-md ${
                    result.is_duplicate ? 'bg-gray-50 border-gray-200' : 'bg-white border-green-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Conteúdo Principal */}
                    <div className="flex-1 space-y-3">
                      {/* Título e Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-lg text-gray-900">{result.name}</h4>
                        
                        {result.is_duplicate ? (
                          <Badge variant="secondary" className="text-xs">
                            🔄 Já capturado {result.times_found > 1 ? `${result.times_found}x` : ''}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                            🆕 Novo Lead
                          </Badge>
                        )}

                        {result.rating && result.rating >= 4.0 && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                            ⭐ {result.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">{result.phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopyPhone(result.phone!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        {result.address && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{result.address}</span>
                          </div>
                        )}

                        {result.category && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-lg">🏷️</span>
                            <span>{result.category}</span>
                          </div>
                        )}
                        
                        {result.rating && result.rating > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            <span>
                              {result.rating.toFixed(1)} 
                              {result.reviews_count > 0 && ` (${result.reviews_count} avaliações)`}
                            </span>
                          </div>
                        )}

                        {result.website && (
                          <div className="flex items-center gap-2 text-sm col-span-full">
                            <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <a 
                              href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline line-clamp-1 flex items-center gap-1"
                            >
                              {result.website}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex flex-col gap-2">
                      {/* Favoritar */}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-9 w-9 p-0 ${isFavorite ? 'bg-red-50 border-red-200' : ''}`}
                        onClick={() => handleToggleFavorite(result)}
                        title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>

                      {/* Abrir no Google Maps */}
                      {result.address && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.address)}`;
                            window.open(mapsUrl, '_blank');
                          }}
                          title="Abrir no Google Maps"
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Abrir Site */}
                      {result.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => {
                            const url = result.website!.startsWith('http') 
                              ? result.website 
                              : `https://${result.website}`;
                            window.open(url, '_blank');
                          }}
                          title="Abrir site"
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Botão Carregar Mais */}
          {hasMore && !isCompleted && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleFetchMore}
                disabled={isSearching}
                size="lg"
                className="min-w-[200px]"
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

      {/* Loading inicial - Skeleton */}
      {isSearching && results.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Buscando leads...</p>
              <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
          <LeadCardSkeletonList count={5} />
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
