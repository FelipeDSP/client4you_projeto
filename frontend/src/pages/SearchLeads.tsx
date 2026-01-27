import { LeadSearch } from "@/components/LeadSearch";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadTable } from "@/components/LeadTable";
import { Card } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";

export default function SearchLeads() {
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
          <LeadSearch />
          <LeadFilters />
        </div>
      </Card>

      {/* Tabela de Resultados */}
      <Card className="bg-white shadow-sm border-none rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Resultados da Busca</h3>
        </div>
        <LeadTable />
      </Card>
    </div>
  );
}