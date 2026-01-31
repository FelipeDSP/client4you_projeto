import { AlertCircle, Check, Crown, Rocket, Zap, Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface QuotaLimitModalProps {
  open: boolean;
  onClose: () => void;
}

export function QuotaLimitModal({ 
  open, 
  onClose
}: QuotaLimitModalProps) {
  
  // URLs do Kiwify - Links de pagamento
  const KIWIFY_BASICO_URL = "https://pay.kiwify.com.br/FzhyShi";
  const KIWIFY_INTERMEDIARIO_URL = "https://pay.kiwify.com.br/YllDqCN";
  const KIWIFY_AVANCADO_URL = "https://pay.kiwify.com.br/TnUQI5f";

  const handleUpgrade = (planUrl: string) => {
    window.open(planUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Limite Atingido! 🚀
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Você atingiu o limite do seu plano. Escolha o melhor plano para você!
          </DialogDescription>
        </DialogHeader>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-4 py-6">
          
          {/* PLANO BÁSICO */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-400 hover:shadow-lg transition-all">
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <h3 className="text-xl font-bold">Básico</h3>
                </div>
                <p className="text-xs text-gray-500">Ideal para começar</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">R$ 39,90</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Extrator de Leads</strong> Ilimitado</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Exportar para Excel/CSV</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Histórico de buscas</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Suporte por email</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400">
                  <span className="w-4 text-center">−</span>
                  <span>Disparador WhatsApp</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400">
                  <span className="w-4 text-center">−</span>
                  <span>Agente IA</span>
                </div>
              </div>

              {/* CTA */}
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade(KIWIFY_BASICO_URL)}
              >
                Assinar Básico
              </Button>
            </div>
          </Card>

          {/* PLANO INTERMEDIÁRIO - MAIS POPULAR */}
          <Card className="relative overflow-hidden border-2 border-primary shadow-xl scale-105">
            <div className="absolute top-0 left-0 right-0 bg-primary text-white px-4 py-1.5 text-xs font-semibold text-center">
              ⭐ MAIS POPULAR
            </div>
            
            <div className="p-5 pt-10 space-y-4">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">Intermediário</h3>
                </div>
                <p className="text-xs text-gray-500">Para profissionais</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">R$ 99,90</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Tudo do plano <strong>Básico</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Disparador WhatsApp</strong> Ilimitado</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Conexão WhatsApp automatizada</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Upload de listas de contatos</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Agendamento de mensagens</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Suporte prioritário</span>
                </div>
              </div>

              {/* CTA */}
              <Button 
                className="w-full"
                onClick={() => handleUpgrade(KIWIFY_INTERMEDIARIO_URL)}
              >
                Assinar Intermediário
              </Button>
            </div>
          </Card>

          {/* PLANO AVANÇADO */}
          <Card className="relative overflow-hidden border-2 border-purple-400 hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-white">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-purple-700 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
              + IA
            </div>
            
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <h3 className="text-xl font-bold">Avançado</h3>
                </div>
                <p className="text-xs text-gray-500">Solução completa com IA</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">R$ 199,90</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Tudo do plano <strong>Intermediário</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span><strong>Agente de IA</strong></span>
                    <Badge variant="secondary" className="ml-2 text-xs">Em breve</Badge>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Automações avançadas com IA</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Respostas automáticas inteligentes</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Múltiplas instâncias WhatsApp</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>API de integração + Suporte dedicado</span>
                </div>
              </div>

              {/* CTA */}
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                onClick={() => handleUpgrade(KIWIFY_AVANCADO_URL)}
              >
                Assinar Avançado
              </Button>
            </div>
          </Card>
        </div>

        {/* Garantia */}
        <div className="text-center space-y-2 pt-4 border-t">
          <Badge variant="secondary" className="text-sm">
            🔒 Pagamento 100% Seguro via Kiwify
          </Badge>
          <p className="text-sm text-gray-500">
            💯 Garantia de 7 dias • Cancele quando quiser • Sem fidelidade
          </p>
        </div>

        {/* Fechar */}
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="w-full"
        >
          Talvez depois
        </Button>
      </DialogContent>
    </Dialog>
  );
}
