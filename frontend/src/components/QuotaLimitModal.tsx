import { AlertCircle, Sparkles, Zap, Check, Crown, Rocket } from "lucide-react";
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
  
  // URLs do Kiwify (substitua pelos seus links reais)
  const KIWIFY_PRO_URL = "https://pay.kiwify.com.br/SEU_LINK_PRO";
  const KIWIFY_ENTERPRISE_URL = "https://pay.kiwify.com.br/SEU_LINK_ENTERPRISE";

  const handleUpgrade = (planUrl: string) => {
    window.open(planUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Limite Atingido! 🚀
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Você atingiu o limite do seu plano. Faça upgrade para continuar usando!
          </DialogDescription>
        </DialogHeader>

        {/* Planos */}
        <div className="grid md:grid-cols-2 gap-6 py-6">
          
          {/* PLANO PRO */}
          <Card className="relative overflow-hidden border-2 border-primary hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
              MAIS POPULAR
            </div>
            
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Rocket className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-bold">Plano Pro</h3>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">R$ 97</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <p className="text-sm text-gray-500">
                  Ideal para profissionais e pequenas equipes
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Buscas Ilimitadas</p>
                    <p className="text-sm text-gray-500">Capture quantos leads quiser</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Disparador WhatsApp</p>
                    <p className="text-sm text-gray-500">Envio automatizado de mensagens</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">1 Conexão WhatsApp</p>
                    <p className="text-sm text-gray-500">QR Code rápido e fácil</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Campanhas Ilimitadas</p>
                    <p className="text-sm text-gray-500">Quantas precisar</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Suporte Prioritário</p>
                    <p className="text-sm text-gray-500">Resposta em até 24h</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button 
                className="w-full h-12 text-lg font-semibold"
                onClick={() => handleUpgrade(KIWIFY_PRO_URL)}
              >
                Assinar Plano Pro
              </Button>
            </div>
          </Card>

          {/* PLANO ENTERPRISE */}
          <Card className="relative overflow-hidden border-2 border-purple-500 hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-white">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
              EMPRESAS
            </div>
            
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-6 w-6 text-purple-600" />
                  <h3 className="text-2xl font-bold">Plano Enterprise</h3>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">R$ 297</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <p className="text-sm text-gray-500">
                  Para empresas que precisam de mais
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Tudo do Plano Pro</p>
                    <p className="text-sm text-gray-500">Todos os recursos inclusos</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Múltiplas Conexões WhatsApp</p>
                    <p className="text-sm text-gray-500">Até 5 números simultaneamente</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Multi-Servidor</p>
                    <p className="text-sm text-gray-500">Distribuição de carga avançada</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Usuários Ilimitados</p>
                    <p className="text-sm text-gray-500">Toda sua equipe conectada</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Suporte VIP</p>
                    <p className="text-sm text-gray-500">WhatsApp direto + prioridade máxima</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                onClick={() => handleUpgrade(KIWIFY_ENTERPRISE_URL)}
              >
                Assinar Plano Enterprise
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
