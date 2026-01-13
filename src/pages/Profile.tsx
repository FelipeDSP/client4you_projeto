import { useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Building2, Mail, CreditCard, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const { credits, totalCredits, plan } = useCredits();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || "");
  const [company, setCompany] = useState(user?.company || "");

  const creditsPercentage = (credits / totalCredits) * 100;

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
          <p className="text-muted-foreground">Gerencie suas informações e plano</p>
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

          {/* Plan & Credits */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {plan.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.price === 0 ? "Gratuito" : `R$ ${plan.price}/mês`}
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/pricing">
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade
                    </Link>
                  </Button>
                </div>

                <ul className="space-y-1 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Créditos
                </CardTitle>
                <CardDescription>
                  Créditos disponíveis este mês
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilizados</span>
                    <span className="font-medium">
                      {totalCredits - credits} de {totalCredits}
                    </span>
                  </div>
                  <Progress value={100 - creditsPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm">Créditos restantes</span>
                  <span className="text-2xl font-bold text-primary">{credits}</span>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Os créditos são renovados no início de cada mês
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
