import { Header } from "@/components/Header";
import { useCredits, plans } from "@/hooks/useCredits";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { plan: currentPlan } = useCredits();
  const { toast } = useToast();

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan.id) {
      toast({
        title: "Plano atual",
        description: "Você já está neste plano.",
      });
      return;
    }

    toast({
      title: "Upgrade solicitado",
      description: "Em breve você será redirecionado para o checkout. (Demo)",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Extraia leads do Google Maps de forma simples e escalável.
            Escolha o plano que melhor atende suas necessidades.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            const isPopular = plan.id === "pro";

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isPopular
                    ? "border-primary shadow-lg scale-105"
                    : ""
                } ${isCurrentPlan ? "bg-primary/5" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.id === "free" && "Para começar"}
                    {plan.id === "pro" && "Para profissionais"}
                    {plan.id === "enterprise" && "Para empresas"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-6">
                  <div>
                    <span className="text-4xl font-bold">
                      {plan.price === 0 ? "Grátis" : `R$ ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/mês</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{plan.credits.toLocaleString()}</span>
                    <span className="text-muted-foreground">leads/mês</span>
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Todos os planos incluem suporte e atualizações.</p>
          <p className="mt-1">Cancele a qualquer momento. Sem taxas escondidas.</p>
        </div>
      </main>
    </div>
  );
}
