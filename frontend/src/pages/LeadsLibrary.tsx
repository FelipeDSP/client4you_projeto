import { useState, useEffect } from "react";
import { useLeadsLibrary, type LeadFilters, type SortOption } from "@/hooks/useLeadsLibrary";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Library, Search, Download, Star, StarOff, Tag, 
  Filter, SortAsc, Loader2, Trash2, RefreshCw
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
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function LeadsLibrary() {
  const { setPageTitle } = usePageTitle();
  const {
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
    deleteLead,
    clearAllLeads,
    refreshLeads
  } = useLeadsLibrary();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    setPageTitle("Biblioteca de Leads", Library);
  }, [setPageTitle]);

  // Aplicar filtros quando mudar
  const handleApplyFilters = () => {
    const newFilters: LeadFilters = {};
    
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedCategory !== "all") newFilters.category = selectedCategory;
    if (minRating > 0) newFilters.minRating = minRating;

    applyFilters(newFilters);
  };

  // Buscar ao pressionar Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Exportar para Excel
  const handleExport = () => {
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
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `biblioteca-leads-${timestamp}.xlsx`);
    
    toast.success(`${exportData.length} leads exportados com sucesso!`);
  };

  // Deletar lead
  const handleDeleteLead = async (leadId: string) => {
    const success = await deleteLead(leadId);
    if (success) {
      toast.success("Lead removido com sucesso");
    } else {
      toast.error("Erro ao remover lead");
    }
  };

  // Limpar biblioteca
  const handleClearAll = async () => {
    const success = await clearAllLeads();
    if (success) {
      toast.success("Biblioteca limpa com sucesso");
    } else {
      toast.error("Erro ao limpar biblioteca");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">
            Biblioteca de Leads
          </h2>
          <p className="text-muted-foreground mt-1">
            {totalCount > 0 
              ? `${totalCount.toLocaleString('pt-BR')} lead${totalCount !== 1 ? 's' : ''} capturado${totalCount !== 1 ? 's' : ''}`
              : 'Nenhum lead capturado ainda'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshLeads}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
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
                  Tem certeza que deseja remover todos os {totalCount} leads da biblioteca? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive">
                  Sim, limpar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, endereço ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {/* TODO: Carregar categorias dinamicamente */}
              </SelectContent>
            </Select>

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
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <Select value={sortBy} onValueChange={(v) => changeSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="most_found">Mais vistos</SelectItem>
                  <SelectItem value="highest_rating">Melhor avaliação</SelectItem>
                  <SelectItem value="favorites">Favoritos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {Object.keys(filters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setMinRating(0);
                  applyFilters({});
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Lista de Leads */}
      <div className="space-y-3">
        {leads.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <Library className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Biblioteca vazia</h3>
            <p className="text-gray-500 mt-2">
              Comece buscando leads para construir sua biblioteca
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/search'}>
              Buscar Leads
            </Button>
          </Card>
        )}

        {leads.map((lead) => (
          <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
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
                  
                  {lead.category && (
                    <div>🏷️ {lead.category}</div>
                  )}
                  
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
                    {lead.tags.map((tag, idx) => (
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
                  onClick={() => toggleFavorite(lead.id)}
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
                        Tem certeza que deseja remover "{lead.name}" da biblioteca?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteLead(lead.id)}
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
        ))}
      </div>

      {/* Botão Carregar Mais */}
      {hasMore && !isLoading && leads.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchLeads()}
            disabled={isLoading}
          >
            Carregar mais 50 leads
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
