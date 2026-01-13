import { useState } from "react";
import { Header } from "@/components/Header";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadTable } from "@/components/LeadTable";
import { ExportButton } from "@/components/ExportButton";
import { StatsCards } from "@/components/StatsCards";
import { useLeads } from "@/hooks/useLeads";
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
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSearch = async (query: string, location: string) => {
    const results = await searchLeads(query, location);
    toast({
      title: "Busca concluída!",
      description: `${results.length} leads encontrados para "${query}" em ${location}`,
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Leads Extraídos
            {selectedLeads.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({selectedLeads.length} selecionados)
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

        {/* Leads Table */}
        <LeadTable
          leads={leads}
          onDelete={deleteLead}
          selectedLeads={selectedLeads}
          onSelectionChange={setSelectedLeads}
        />
      </main>
    </div>
  );
}
