import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuotas } from "@/hooks/useQuotas"; // Usando o hook real de quotas
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Building2, CreditCard, Zap, Crown, Loader2, Shield, Mail, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QuotaLimitModal } from "@/components/QuotaLimitModal";

export default function Profile() {
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {
    setPageTitle("Minha Conta", User);
  }, [setPageTitle]);

  const { user } = useAuth();
  const { quota, isLoading: isLoadingQuota } = useQuotas();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Carregar dados iniciais quando o user estiver pronto
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCompany(user.company || ""); // Nota: Se 'company' não existir no tipo User, talvez precise ajustar
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Atualiza o perfil no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: name,
          // Se tiver campo de empresa no banco, adicione aqui. Ex: company_name: company
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast({
        title: "E-mail enviado",
        description: "Verifique seu e-mail para redefinir a senha.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o e-mail de redefinição.",
      });
    }
  };

  // Cores do plano
  const planColors = {
    demo: "bg-gray-500",
    free: "bg-blue-500",
    pro: "bg-orange-500",
    enterprise: "bg-purple-600"
  };

  const planName = quota?.plan_name || "Plano Gratuito";
  const planType = (quota?.plan_type as keyof typeof planColors) || "free";

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
      
      {/* Cabeçalho do Perfil */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-slate-100">
            <AvatarFallback className="bg-gradient-to-br from-primary to-orange-600 text-white text-2xl font-bold">
              {name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{name || "Usuário"}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={`${planColors[planType]} text-white border-0`}>
                {planName}
              </Badge>
              {quota?.plan_expires_at && (
                <span className="text-xs text-muted-foreground">
                  Expira em: {new Date(quota.plan_expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={handleResetPassword} className="flex-1 md:flex-none gap-2">
            <KeyRound className="h-4 w-4" />
            Trocar Senha
          </Button>
          {planType !== 'enterprise' && (
            <Button 
              onClick={() => setShowUpgradeModal(true)} 
              className="flex-1 md:flex-none gap-2 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700"
            >
              <Crown className="h-4 w-4" />
              Fazer Upgrade
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Coluna Esquerda: Dados Pessoais */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados da Conta
              </CardTitle>
              <CardDescription>Atualize suas informações de identificação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail de Acesso</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por segurança.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company">Nome da Empresa (Opcional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Sua empresa"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-slate-50/50 px-6 py-4">
              <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Segurança e Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">Senha de Acesso</p>
                  <p className="text-sm text-muted-foreground">Recomendamos usar uma senha forte.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetPassword}>Redefinir</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Plano e Consumo */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Seu Plano
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Resumo do Plano */}
              <div className="text-center">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Plano Atual</span>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{planName}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {quota?.plan_expires_at 
                    ? `Renova em ${new Date(quota.plan_expires_at).toLocaleDateString()}` 
                    : "Acesso Vitalício"}
                </p>
              </div>

              {/* Barras de Progresso */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Buscas de Leads</span>
                    <span className="font-medium">
                      {quota?.leads_limit === -1 
                        ? `${quota?.leads_used} / ∞` 
                        : `${quota?.leads_used || 0} / ${quota?.leads_limit || 0}`}
                    </span>
                  </div>
                  <Progress 
                    value={quota?.leads_limit === -1 ? 100 : ((quota?.leads_used || 0) / (quota?.leads_limit || 1)) * 100} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Campanhas</span>
                    <span className="font-medium">
                      {quota?.campaigns_limit === -1 
                        ? `${quota?.campaigns_used} / ∞` 
                        : `${quota?.campaigns_used || 0} / ${quota?.campaigns_limit || 0}`}
                    </span>
                  </div>
                  <Progress 
                    value={quota?.campaigns_limit === -1 ? 100 : ((quota?.campaigns_used || 0) / (quota?.campaigns_limit || 1)) * 100} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Disparos WhatsApp</span>
                    <span className="font-medium">
                      {quota?.messages_limit === -1 
                        ? `${quota?.messages_sent} / ∞` 
                        : `${quota?.messages_sent || 0} / ${quota?.messages_limit || 0}`}
                    </span>
                  </div>
                  <Progress 
                    value={quota?.messages_limit === -1 ? 100 : ((quota?.messages_sent || 0) / (quota?.messages_limit || 1)) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800" 
                onClick={() => setShowUpgradeModal(true)}
              >
                <Zap className="mr-2 h-4 w-4 text-yellow-400" />
                Ver Planos Disponíveis
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Upgrade (Invisível até clicar) */}
      <QuotaLimitModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </div>
  );
}