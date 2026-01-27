import { StatsCards } from "@/components/StatsCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Activity } from "lucide-react";

export default function Dashboard() {
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

      {/* Cards de Estatísticas (Mantidos) */}
      <StatsCards />

      {/* Exemplo de nova seção: Atividade Recente ou Gráficos (Placeholder) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 p-6 bg-white shadow-sm border-none rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Atividade Recente
            </h3>
          </div>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
            <p className="text-muted-foreground text-sm">Gráfico de desempenho será exibido aqui</p>
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