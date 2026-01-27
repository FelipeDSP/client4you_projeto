import { useState } from "react";
import { LeadSearch } from "@/components/LeadSearch";
import { LeadFilters, LeadFilterState, defaultFilters, filterLeads } from "@/components/LeadFilters";
import { LeadTable } from "@/components/LeadTable";
import { Card } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { useLeads } from "@/hooks/useLeads";

export default function SearchLeads() {
  const [filters, setFilters] = useState<LeadFilterState>(defaultFilters);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // 1. IMPORTANTE: Extraímos a função searchLeads e o estado isSearching do hook
  const { 
    leads, 
    deleteLead, 
    isLoading, 
    searchLeads,   // <--- Faltava isto
    isSearching    // <--- Faltava isto
  } = useLeads();

  // Garante que leads é um array
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
        
        <ExportButton 
          leads={filteredLeads} 
          selectedLeads={selectedLeads} 
        />
      </div>

      {/* Área de Busca e Filtros */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-6">
          {/* 2. IMPORTANTE: Passamos as funções para o componente funcionar */}
          <LeadSearch 
            onSearch={searchLeads} 
            isSearching={isSearching} 
          />
          
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
        
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Carregando sua base de leads...
          </div>
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