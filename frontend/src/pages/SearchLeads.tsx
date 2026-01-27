import { useState } from "react";
import { LeadSearch } from "@/components/LeadSearch";
// Importamos os tipos e funções atualizadas
import { LeadFilters, LeadFilterState, defaultFilters, filterLeads } from "@/components/LeadFilters";
import { LeadTable } from "@/components/LeadTable";
import { Card } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { useLeads } from "@/hooks/useLeads"; // Hook para buscar dados

export default function SearchLeads() {
  // 1. Estado dos Filtros
  const [filters, setFilters] = useState<LeadFilterState>(defaultFilters);
  
  // 2. Buscar dados reais do Supabase
  const { leads, isLoading } = useLeads();

  // 3. Aplicar a lógica de filtro nos dados
  const filteredLeads = filterLeads(leads || [], filters);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Buscar Leads</h2>
          <p className="text-muted-foreground mt-1">
            Encontre e gerencie novos contatos para suas campanhas.
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Área de Busca e Filtros */}
      <Card className="p-6 bg-white shadow-sm border-none rounded-xl">
        <div className="space-y-6">
          {/* Componente de Busca do Google Maps (Mock ou Real) */}
          <LeadSearch />
          
          {/* Componente de Filtros Local */}
          <LeadFilters 
            leads={leads || []} 
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
        {/* Passamos os leads JÁ FILTRADOS para a tabela */}
        <LeadTable leads={filteredLeads} isLoading={isLoading} />
      </Card>
    </div>
  );
}