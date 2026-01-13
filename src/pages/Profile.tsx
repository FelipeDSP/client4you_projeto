import { useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useCredits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Building2, CreditCard, Zap, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const { currentPlan, demoUsed } = useSubscription();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || "");
  const [company, setCompany] = useState(user?.company || "");

  const handleSave = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações e assinatura</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Nome da empresa"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Assinatura Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={currentPlan.isDemo ? "secondary" : "default"} className="text-lg px-3 py-1">
                      {currentPlan.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentPlan.price === 0 ? "Gratuito" : `R$ ${currentPlan.price}/mês`}
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/pricing">
                      <Zap className="mr-2 h-4 w-4" />
                      {currentPlan.isDemo ? "Assinar" : "Upgrade"}
                    </Link>
                  </Button>
                </div>

                {currentPlan.isDemo && demoUsed && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      Demonstração expirada
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assine um plano para continuar usando todas as funcionalidades.
                    </p>
                  </div>
                )}

                <ul className="space-y-2 text-sm">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex flex-col">
                        <span className={!feature.included ? "text-muted-foreground/50" : ""}>
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
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status da Conta</CardTitle>
                <CardDescription>
                  Informações sobre sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tipo de plano</span>
                    <span className="font-medium">
                      {currentPlan.isDemo ? "Demonstração" : "Assinatura Mensal"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={currentPlan.isDemo && demoUsed ? "destructive" : "secondary"}>
                      {currentPlan.isDemo ? (demoUsed ? "Expirado" : "Ativo") : "Ativo"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
