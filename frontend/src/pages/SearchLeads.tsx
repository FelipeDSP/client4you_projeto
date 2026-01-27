import { useState } from "react";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadFilters, LeadFilterState, defaultFilters, filterLeads } from "@/components/LeadFilters";
import { LeadTable } from "@/components/LeadTable";
import { Card } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { useLeads } from "@/hooks/useLeads";

export default function SearchLeads() {
  // 1. Estado para os filtros e seleção
  const [filters, setFilters] = useState<LeadFilterState>(defaultFilters);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // 2. Buscar dados do hook (incluindo função de deletar)
  const { leads, deleteLead, isLoading } = useLeads();

  // 3. Garantir que leads é um array e aplicar filtros
  const safeLeads = leads || [];
  const filteredLeads = filterLeads(safeLeads, filters);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Buscar Leads</h2>
          <p className="text-muted-foreground mt-1">
            Encontre e gerencie novos contatos para suas campanhas.
          </p>
        </div>
        
        {/* CORREÇÃO: Passar props obrigatórias para o ExportButton */}
        <ExportButton 
          leads={filteredLeads} 
          selectedLeads={selectedLeads} 
        />
      </div>

      {/* Área de Busca e Filtros */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-6">
          <LeadSearch />
          <LeadFilters 
            leads={safeLeads} 
            filters={filters} 
            onFiltersChange={setFilters} 
          />
        </div>
      </Card>

      {/* Tabela de Resultados */}
      <Card className="bg-white shadow-sm border-none rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Resultados da Busca</h3>
          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
            {filteredLeads.length} leads encontrados
          </span>
        </div>
        
        {/* CORREÇÃO: Passar props obrigatórias para a LeadTable */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando leads...</div>
        ) : (
          <LeadTable 
            leads={filteredLeads} 
            onDelete={deleteLead} 
            selectedLeads={selectedLeads}
            onSelectionChange={setSelectedLeads}
          />
        )}
      </Card>
    </div>
  );
}