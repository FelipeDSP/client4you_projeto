import { Header } from "@/components/Header";
import { useSubscription, plans } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { currentPlan, demoUsed } = useSubscription();
  const { toast } = useToast();

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan.id) {
      toast({
        title: "Plano atual",
        description: "Você já está neste plano.",
      });
      return;
    }

    if (planId === "demo") {
      toast({
        title: "Plano Demo",
        description: "O plano Demo é apenas para novos usuários.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Assinatura solicitada",
      description: "Em breve você será redirecionado para o checkout. (Demo)",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Planos e Preços</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para suas necessidades.
            Assine mensalmente e tenha acesso a todas as funcionalidades.
          </p>
        </div>

        {currentPlan.isDemo && demoUsed && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">Seu período de demonstração expirou</p>
                <p className="text-sm text-muted-foreground">Escolha um plano para continuar usando todas as funcionalidades.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            const isPopular = plan.id === "pro";
            const isDemo = plan.isDemo;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isPopular
                    ? "border-primary shadow-lg scale-105 z-10"
                    : ""
                } ${isCurrentPlan ? "bg-primary/5" : ""} ${isDemo ? "opacity-75" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {isDemo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="gap-1">
                      Uso Único
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-6 flex-1">
                  <div>
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? "Grátis" : `R$ ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/mês</span>
                    )}
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col">
                          <span className={`text-sm ${!feature.included ? "text-muted-foreground/50" : ""}`}>
                            {feature.name}
                          </span>
                          {feature.limit && feature.included && (
                            <span className="text-xs text-muted-foreground">{feature.limit}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrentPlan || (isDemo && demoUsed)}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrentPlan 
                      ? "Plano Atual" 
                      : isDemo 
                        ? (demoUsed ? "Demo Expirado" : "Usar Demo")
                        : "Assinar Agora"
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>Todos os planos pagos incluem suporte e atualizações.</p>
          <p>Cancele a qualquer momento. Sem taxas escondidas.</p>
          <p className="text-xs mt-4">* O plano Demo é limitado e não renova. Ideal para testar a plataforma.</p>
        </div>
      </main>
    </div>
  );
}
