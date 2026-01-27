import { StatsCards } from "@/components/StatsCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Activity } from "lucide-react";
import { useLeads } from "@/hooks/useLeads"; // <--- 1. Importar o hook de dados

export default function Dashboard() {
  // 2. Buscar os dados reais do sistema
  // "leads" e "searchHistory" vêm daqui, evitando que sejam "undefined"
  const { leads, searchHistory, isLoading } = useLeads();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Dashboard */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Visão Geral</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho das suas campanhas e base de leads.
          </p>
        </div>
        
        {/* Botão de Ação Rápida */}
        <Link to="/search">
          <Button className="gap-2 shadow-sm">
            <Search className="h-4 w-4" />
            Buscar Novos Leads
          </Button>
        </Link>
      </div>

      {/* 3. Passar os dados para os Cards (CRUCIAL para corrigir o erro) */}
      {/* Usamos "|| []" para garantir que, mesmo carregando, seja uma lista vazia e não quebre */}
      <StatsCards 
        leads={leads || []} 
        searchHistory={searchHistory || []} 
      />

      {/* Seção de Atividade e Status */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 p-6 bg-white shadow-sm border-none rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Atividade Recente
            </h3>
          </div>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando dados...</p>
            ) : leads?.length === 0 ? (
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-2">Nenhum lead encontrado ainda.</p>
                <Link to="/search" className="text-green-600 hover:underline text-sm">Começar busca</Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Gráfico de desempenho será exibido aqui</p>
            )}
          </div>
        </Card>

        <Card className="col-span-3 p-6 bg-white shadow-sm border-none rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Status do Sistema</h3>
          </div>
           <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">API do WhatsApp</span>
                <span className="text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full text-xs">Online</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Servidor de Disparos</span>
                <span className="text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full text-xs">Ativo</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link to="/disparador" className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1">
                   Ir para Disparador <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}