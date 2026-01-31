import { useState, useEffect } from "react";
import { useLeadsLibrary, type SortOption } from "@/hooks/useLeadsLibrary";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History as HistoryIcon, Library, Star, Search, Download, 
  Loader2, Trash2, RefreshCw, Calendar, Filter, SortAsc, StarOff, Tag
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";

interface SearchHistoryItem {
  id: string;
  query: string;
  location: string;
  search_type: string;
  new_leads_count: number;
  duplicate_leads_count: number;
  total_results_found: number;
  status: string;
  created_at: string;
  last_fetch_at: string;
}

export default function History() {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estado para abas
  const [activeTab, setActiveTab] = useState("buscas");
  
  // Estado para histórico de buscas
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Hook da biblioteca
  const {
    leads,
    totalCount,
    hasMore,
    isLoading,
    sortBy,
    fetchLeads,
    changeSortBy,
    toggleFavorite,
    deleteLead,
    clearAllLeads,
    refreshLeads,
    applyFilters
  } = useLeadsLibrary();

  // Filtros para biblioteca
  const [searchTerm, setSearchTerm] = useState("");
  const [minRating, setMinRating] = useState<number>(0);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    setPageTitle("Histórico & Biblioteca", HistoryIcon);
  }, [setPageTitle]);

  // Carregar histórico de buscas
  useEffect(() => {
    fetchSearchHistory();
  }, [user?.companyId]);

  const fetchSearchHistory = async () => {
    if (!user?.companyId) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('search_sessions')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching search history:", error);
      } else {
        setSearchHistory(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Aplicar filtros da biblioteca
  const handleApplyFilters = () => {
    const filters: any = {};
    
    if (searchTerm) filters.search = searchTerm;
    if (minRating > 0) filters.minRating = minRating;
    if (showOnlyFavorites) filters.isFavorite = true;

    applyFilters(filters);
  };

  // Exportar biblioteca
  const handleExportLibrary = () => {
    if (leads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    const exportData = leads.map(lead => ({
      Nome: lead.name,
      Telefone: lead.phone,
      'WhatsApp': lead.hasWhatsApp ? 'Sim' : 'Não',
      Email: lead.email || '',
      Endereço: lead.address,
      Categoria: lead.category,
      'Avaliação': lead.rating || '',
      'Reviews': lead.reviews || 0,
      'Site': lead.website || '',
      'Visto': lead.timesSeen || 1,
      'Primeira vez': lead.firstSeenAt ? new Date(lead.firstSeenAt).toLocaleDateString('pt-BR') : '',
      'Última vez': lead.lastSeenAt ? new Date(lead.lastSeenAt).toLocaleDateString('pt-BR') : '',
      'Favorito': lead.isFavorite ? 'Sim' : 'Não',
      'Tags': lead.tags?.join(', ') || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Biblioteca");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `biblioteca-leads-${timestamp}.xlsx`);
    
    toast.success(`${exportData.length} leads exportados com sucesso!`);
  };

  // Deletar histórico de busca
  const handleDeleteSearchHistory = async (sessionId: string) => {
    const { error } = await supabase
      .from('search_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast.error("Erro ao deletar histórico");
      console.error(error);
    } else {
      toast.success("Histórico deletado");
      fetchSearchHistory();
    }
  };

  // Deletar lead individual
  const handleDeleteLead = async (leadId: string) => {
    const success = await deleteLead(leadId);
    if (success) {
      toast.success("Lead removido com sucesso");
    } else {
      toast.error("Erro ao remover lead");
    }
  };

  // Limpar toda biblioteca
  const handleClearAllLeads = async () => {
    const success = await clearAllLeads();
    if (success) {
      toast.success("Biblioteca limpa com sucesso");
    } else {
      toast.error("Erro ao limpar biblioteca");
    }
  };

  // Leads favoritos
  const favoriteLeads = leads.filter(l => l.isFavorite);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">
            Histórico & Biblioteca
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie suas buscas e leads capturados
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate('/search')}
        >
          <Search className="h-4 w-4 mr-2" />
          Buscar Novos Leads
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buscas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Buscas ({searchHistory.length})
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Biblioteca ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="favoritos" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favoritos ({favoriteLeads.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: HISTÓRICO DE BUSCAS */}
        <TabsContent value="buscas" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Histórico de Buscas</h3>
                <p className="text-sm text-gray-500">
                  Todas as suas buscas realizadas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSearchHistory}
                disabled={isLoadingHistory}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchHistory.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma busca realizada ainda</p>
                <Button className="mt-4" onClick={() => navigate('/search')}>
                  Fazer Primeira Busca
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {searchHistory.map((item) => (
                  <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            "{item.query}"
                            {item.location && ` em ${item.location}`}
                          </h4>
                          
                          <Badge variant={item.status === 'completed' ? 'secondary' : 'default'}>
                            {item.status === 'completed' ? 'Completa' : 
                             item.status === 'active' ? 'Ativa' : 
                             item.status === 'error' ? 'Erro' : item.status}
                          </Badge>
                          
                          <Badge variant="outline">
                            {item.search_type === 'serp' ? 'Google Maps' : 'CNAE'}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span>
                              🆕 {item.new_leads_count} novos
                            </span>
                            <span>
                              🔄 {item.duplicate_leads_count} já existentes
                            </span>
                            <span>
                              📊 Total: {item.total_results_found}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Histórico</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este histórico de busca?
                              Os leads capturados permanecerão na biblioteca.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSearchHistory(item.id)}
                              className="bg-destructive"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ABA 2: BIBLIOTECA DE LEADS */}
        <TabsContent value="biblioteca" className="space-y-4 mt-6">
          {/* Filtros */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nome, endereço ou categoria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={minRating.toString()} onValueChange={(v) => setMinRating(parseInt(v))}>
                  <SelectTrigger className="w-[180px]">
                    <Star className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Avaliação mín." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Qualquer</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ ou mais</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ ou mais</SelectItem>
                    <SelectItem value="4.5">⭐⭐⭐⭐⭐ (4.5+)</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleApplyFilters}>
                  Filtrar
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Ordenar:</span>
                    <Select value={sortBy} onValueChange={(v) => changeSortBy(v as SortOption)}>
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mais recentes</SelectItem>
                        <SelectItem value="oldest">Mais antigos</SelectItem>
                        <SelectItem value="most_found">Mais vistos</SelectItem>
                        <SelectItem value="highest_rating">Melhor avaliação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshLeads}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLibrary}
                    disabled={leads.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={totalCount === 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Tudo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar Biblioteca</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover todos os {totalCount} leads? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllLeads} className="bg-destructive">
                          Sim, limpar tudo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista de Leads */}
          {leads.length === 0 && !isLoading ? (
            <Card className="p-12 text-center">
              <Library className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Biblioteca vazia</h3>
              <p className="text-gray-500 mt-2">
                Comece buscando leads para construir sua biblioteca
              </p>
              <Button className="mt-4" onClick={() => navigate('/search')}>
                Buscar Leads
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <LeadCard 
                  key={lead.id}
                  lead={lead}
                  onToggleFavorite={() => toggleFavorite(lead.id)}
                  onDelete={() => handleDeleteLead(lead.id)}
                />
              ))}

              {hasMore && !isLoading && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchLeads()}
                  >
                    Carregar mais 50 leads
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ABA 3: FAVORITOS */}
        <TabsContent value="favoritos" className="space-y-4 mt-6">
          {favoriteLeads.length === 0 ? (
            <Card className="p-12 text-center">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Nenhum favorito ainda</h3>
              <p className="text-gray-500 mt-2">
                Marque leads como favoritos para acesso rápido
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {favoriteLeads.map((lead) => (
                <LeadCard 
                  key={lead.id}
                  lead={lead}
                  onToggleFavorite={() => toggleFavorite(lead.id)}
                  onDelete={() => handleDeleteLead(lead.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de Card de Lead (reutilizável)
function LeadCard({ lead, onToggleFavorite, onDelete }: any) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{lead.name}</h3>
            
            {lead.isFavorite && (
              <Badge variant="secondary" className="text-yellow-600">
                <Star className="h-3 w-3 fill-current mr-1" />
                Favorito
              </Badge>
            )}
            
            {lead.timesSeen && lead.timesSeen > 1 && (
              <Badge variant="outline">
                Visto {lead.timesSeen}x
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            {lead.phone && (
              <div>
                📞 {lead.phone}
                {lead.hasWhatsApp && (
                  <Badge variant="secondary" className="ml-2 text-xs">WhatsApp</Badge>
                )}
              </div>
            )}
            
            {lead.address && <div>📍 {lead.address}</div>}
            
            {lead.category && <div>🏷️ {lead.category}</div>}
            
            {lead.rating > 0 && (
              <div>⭐ {lead.rating.toFixed(1)} ({lead.reviews} reviews)</div>
            )}

            {lead.website && (
              <div>
                🌐 <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {lead.website}
                </a>
              </div>
            )}
          </div>

          {lead.tags && lead.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {lead.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {lead.lastSeenAt && (
            <div className="text-xs text-gray-400 mt-2">
              Última vez: {new Date(lead.lastSeenAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
          >
            {lead.isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Lead</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover "{lead.name}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  className="bg-destructive"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
