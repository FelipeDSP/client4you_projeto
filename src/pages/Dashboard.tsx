import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadTable } from "@/components/LeadTable";
import { ExportButton } from "@/components/ExportButton";
import { StatsCards } from "@/components/StatsCards";
import { LeadFiltersComponent, LeadFilters, defaultFilters, filterLeads } from "@/components/LeadFilters";
import { useLeads } from "@/hooks/useLeads";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function Dashboard() {
  const { leads, searchHistory, isSearching, searchLeads, deleteLead, clearAllLeads } = useLeads();
  const { credits, useCredits: spendCredits } = useCredits();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);
  const { toast } = useToast();

  const filteredLeads = useMemo(() => filterLeads(leads, filters), [leads, filters]);

  const handleSearch = async (query: string, location: string) => {
    // Check credits
    if (credits < 1) {
      toast({
        title: "Créditos insuficientes",
        description: "Você não tem créditos suficientes. Faça upgrade do seu plano.",
        variant: "destructive",
      });
      return;
    }

    const results = await searchLeads(query, location);
    
    // Deduct credits based on results
    const creditsUsed = Math.ceil(results.length / 10); // 1 credit per 10 leads
    spendCredits(creditsUsed);

    toast({
      title: "Busca concluída!",
      description: `${results.length} leads encontrados para "${query}" em ${location}. (${creditsUsed} créditos utilizados)`,
    });
    setSelectedLeads([]);
  };

  const handleClearAll = () => {
    clearAllLeads();
    setSelectedLeads([]);
    toast({
      title: "Leads removidos",
      description: "Todos os leads foram removidos com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Stats */}
        <StatsCards leads={leads} searchHistory={searchHistory} />

        {/* Search */}
        <LeadSearch onSearch={handleSearch} isSearching={isSearching} />

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">
            Leads Extraídos
            {selectedLeads.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({selectedLeads.length} selecionados)
              </span>
            )}
            {filteredLeads.length !== leads.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (mostrando {filteredLeads.length} de {leads.length})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <ExportButton leads={leads} selectedLeads={selectedLeads} />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={leads.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Tudo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover todos os {leads.length} leads. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Sim, limpar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Filters */}
        {leads.length > 0 && (
          <LeadFiltersComponent
            leads={leads}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Leads Table */}
        <LeadTable
          leads={filteredLeads}
          onDelete={deleteLead}
          selectedLeads={selectedLeads}
          onSelectionChange={setSelectedLeads}
        />
      </main>
    </div>
  );
}
