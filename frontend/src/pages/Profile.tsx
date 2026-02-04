import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuotas } from "@/hooks/useQuotas";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Building2, CreditCard, Zap, Crown, Loader2, Shield, Mail, KeyRound, Save, Copy } from "lucide-react";
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
  const [companyName, setCompanyName] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Carregar dados REAIS das tabelas corretas
  useEffect(() => {
    async function loadProfileData() {
      if (!user) return;
      
      try {
        setLoadingData(true);
        
        // Pega nome do perfil
        setName(user.name || "");

        // Pega nome da empresa (Tabela Companies)
        if (user.companyId) {
          const { data: companyData, error } = await supabase
            .from('companies')
            .select('name')
            .eq('id', user.companyId)
            .single();
            
          if (!error && companyData) {
            setCompanyName(companyData.name);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadProfileData();
  }, [user]);

  // Salvar nas tabelas corretas
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const updates = [];

      // Atualiza Perfil (Usuário)
      const profileUpdate = supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', user.id);
      updates.push(profileUpdate);

      // Atualiza Empresa (Se houver ID)
      if (user.companyId && companyName) {
        const companyUpdate = supabase
          .from('companies')
          .update({ name: companyName })
          .eq('id', user.companyId);
        updates.push(companyUpdate);
      }

      await Promise.all(updates);

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
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
        description: `Link de redefinição enviado para ${user.email}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o e-mail. Tente mais tarde.",
      });
    }
  };

  const handleCopyCompanyId = () => {
    if (user?.companyId) {
      navigator.clipboard.writeText(user.companyId);
      toast({
        title: "Copiado!",
        description: "ID da empresa copiado para a área de transferência.",
      });
    }
  };

  // Cores do plano
  const planColors: Record<string, string> = {
    demo: "bg-gray-500",
    basico: "bg-blue-500",
    intermediario: "bg-orange-500",
    avancado: "bg-purple-600",
    // Fallbacks
    free: "bg-gray-500",
    pro: "bg-orange-500",
    enterprise: "bg-purple-600"
  };

  const planName = quota?.plan_name || "Carregando...";
  const planType = quota?.plan_type || "demo";
  const badgeColor = planColors[planType] || "bg-primary";

  if (loadingData && !name) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Minha Conta</h2>
        <p className="text-muted-foreground">Gerencie seus dados pessoais e assinatura.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Coluna Esquerda: Dados Pessoais (Ocupa 2 colunas) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-slate-100">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-orange-600 text-white text-xl font-bold">
                    {name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Seus dados de identificação na plataforma.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail de Acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-slate-50 text-slate-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por segurança.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company">Nome da Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Sua empresa"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-slate-50/50 px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-green-600" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Senha de Acesso</p>
                  <p className="text-sm text-muted-foreground">Enviaremos um link seguro para seu e-mail.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetPassword} className="gap-2">
                  <KeyRound className="h-4 w-4" />
                  Redefinir Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Plano e Consumo (Ocupa 1 coluna) */}
        <div className="space-y-6">
          <Card className={`border-2 ${planType === 'avancado' ? 'border-purple-200' : 'border-primary/20'} shadow-md overflow-hidden`}>
            <div className={`h-2 w-full ${badgeColor}`} />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Plano Atual</p>
                  <h3 className="text-2xl font-bold text-slate-900">{planName}</h3>
                </div>
                <Badge className={`${badgeColor} text-white border-0 capitalize`}>
                  {planType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {quota?.plan_expires_at 
                  ? `Renova em ${new Date(quota.plan_expires_at).toLocaleDateString()}` 
                  : "Acesso Vitalício"}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Barras de Progresso */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Buscas de Leads</span>
                    <span className="text-slate-900">
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
                    <span className="text-slate-600 font-medium">Disparos WhatsApp</span>
                    <span className="text-slate-900">
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

              {planType !== 'avancado' && (
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md border-0" 
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Fazer Upgrade
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Detalhes da Conta</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">ID da Empresa</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 truncate max-w-[120px]" title={user?.companyId}>
                    {user?.companyId}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-400 hover:text-primary" 
                    onClick={handleCopyCompanyId}
                    title="Copiar ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Status</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" /> Ativo
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Membro desde</span>
                <span className="text-slate-900">
                  {new Date().getFullYear()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Upgrade */}
      <QuotaLimitModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </div>
  );
}