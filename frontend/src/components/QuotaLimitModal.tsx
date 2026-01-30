import { AlertCircle, Sparkles, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface QuotaLimitModalProps {
  open: boolean;
  onClose: () => void;
  limitType: 'leads' | 'campaigns';
  currentPlan: 'demo' | 'free' | 'pro' | 'enterprise';
  used: number;
  limit: number;
}

export function QuotaLimitModal({ 
  open, 
  onClose, 
  limitType, 
  currentPlan,
  used,
  limit 
}: QuotaLimitModalProps) {
  
  const getMessage = () => {
    if (limitType === 'leads') {
      return {
        title: "Limite de Buscas Atingido! 🚀",
        description: `Você usou todas as ${limit} buscas de leads disponíveis no ${currentPlan === 'demo' ? 'Plano Demo' : 'Plano Free'}.`,
        cta: "Ver Planos e Fazer Upgrade"
      };
    } else {
      return {
        title: "Disparador WhatsApp Bloqueado 🔒",
        description: "O Disparador de Mensagens WhatsApp está disponível apenas nos planos Pro e Enterprise.",
        cta: "Desbloquear Disparador"
      };
    }
  };

  const message = getMessage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-2xl">{message.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Usage */}
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Uso Atual</p>
            <p className="text-3xl font-bold">
              {used} <span className="text-lg text-muted-foreground">
                / {limit === -1 ? '∞ Ilimitado' : limit}
              </span>
            </p>
          </div>

          {/* Upgrade Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Com o Plano Pro você tem:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Buscas ilimitadas de leads</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Disparador WhatsApp completo</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Badge className="h-4 text-[10px]">PRO</Badge>
                <span>Conexão automática via QR Code</span>
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Apenas</p>
            <p className="text-3xl font-bold text-primary">R$ 97<span className="text-base">/mês</span></p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Link to="/pricing" className="w-full">
            <Button className="w-full" size="lg">
              {message.cta}
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Talvez depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
