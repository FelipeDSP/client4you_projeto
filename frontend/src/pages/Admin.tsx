import { useState, useCallback } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { plans } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Componentes UI
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Ícones
import { 
  Users, 
  RefreshCw,
  Crown,
  Loader2,
  Trash2,
  Search,
  Send,
  CheckCircle,
  XCircle,
  UserPlus,
  Building2
} from "lucide-react";

export default function Admin() {
  const {
    isAdmin,
    isLoading,
    users,
    companies,
    addAdminRole,
    removeAdminRole,
    updateCompanyPlan,
    deleteUser,
    refreshData,
  } = useAdmin();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [updateKey, setUpdateKey] = useState(0);
  
  // Create user dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPlan, setNewUserPlan] = useState("starter");
  const [isCreating, setIsCreating] = useState(false);

  // Force refresh helper
  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshData();
    setUpdateKey(k => k + 1);
    setIsRefreshing(false);
  }, [refreshData]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // ✅ CORREÇÃO CRÍTICA: Só redireciona se for estritamente false
  // Se for null, o código passa e espera (ou cai no loading acima)
  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRefresh = async () => {
    await forceRefresh();
    toast({ title: "Dados atualizados!" });
  };

  // Get company and subscription info for each user
  const usersWithDetails = users.map((user) => {
    const company = companies.find((c) => c.id === user.companyId);
    return {
      ...user,
      company,
      planId: company?.subscription?.planId || "demo",
      planName: plans.find((p) => p.id === (company?.subscription?.planId || "demo"))?.name || "Demo",
      hasDisparador: ["professional", "business"].includes(company?.subscription?.planId || ""),
      isSuperAdmin: user.roles.includes("super_admin"),
    };
  });

  // Filter users
  const filteredUsers = usersWithDetails.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesPlan = filterPlan === "all" || user.planId === filterPlan;
    
    return matchesSearch && matchesPlan;
  });

  const handleToggleAdmin = async (userId: string, userName: string, isCurrentlyAdmin: boolean) => {
    let success: boolean;
    
    if (isCurrentlyAdmin) {
      success = await removeAdminRole(userId);
      if (success) {
        toast({
          title: "Admin removido",
          description: `${userName} não é mais administrador.`,
        });
      }
    } else {
      success = await addAdminRole(userId);
      if (success) {
        toast({
          title: "Admin adicionado",
          description: `${userName} agora é administrador.`,
        });
      }
    }
    
    if (success) {
      await forceRefresh();
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status de admin.",
        variant: "destructive",
      });
    }
  };

  const handleChangePlan = async (companyId: string | null, planId: string, userName: string) => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "Usuário não está associado a uma empresa.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateCompanyPlan(companyId, planId);
    const planName = plans.find((p) => p.id === planId)?.name || planId;
    
    if (success) {
      toast({
        title: "Plano atualizado",
        description: `${userName} agora está no plano ${planName}.`,
      });
      await forceRefresh();
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const success = await deleteUser(userId);
    if (success) {
      toast({
        title: "Usuário excluído",
        description: `${userName} foi removido do sistema.`,
      });
      await forceRefresh();
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Erro",
        description: "Email e senha são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName,
          },
          emailRedirectTo: undefined,
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Erro ao criar usuário");

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authData.user.id)
        .single();

      if (profileData?.company_id) {
        await supabase
          .from("subscriptions")
          .update({ plan_id: newUserPlan })
          .eq("company_id", profileData.company_id);
      }

      toast({
        title: "Usuário criado!",
        description: `${newUserEmail} foi criado com sucesso.`,
      });

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserPlan("starter");
      setShowCreateDialog(false);
      
      await forceRefresh();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Stats
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.roles.includes("super_admin")).length;
  const professionalUsers = usersWithDetails.filter((u) => ["professional", "business"].includes(u.planId)).length;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Painel Administrativo
            </h2>
            <p className="text-muted-foreground">
              Gestão centralizada de usuários e assinaturas.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="bg-white border-gray-200">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            
            {/* Create User Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie uma conta para um novo cliente manualmente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="Nome do usuário"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plano</Label>
                    <Select value={newUserPlan} onValueChange={setNewUserPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.filter(p => !p.isDemo).map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - R$ {plan.price}/mês
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Usuário"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Separator className="my-4" />
      </div>

      {/* ESTATÍSTICAS (CARDS) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-sm border-none hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAdmins} com acesso administrativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-none hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Premium</CardTitle>
            <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center">
              <Send className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{professionalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Planos com Disparador ativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-none hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Ativas</CardTitle>
            <div className="h-8 w-8 bg-purple-50 rounded-full flex items-center justify-center">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{companies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {companies.filter((c) => c.subscription?.status === "active").length} com assinatura regular
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ÁREA PRINCIPAL - SEM ABAS DESNECESSÁRIAS */}
      <Card className="bg-white shadow-sm border-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Base de Usuários</CardTitle>
              <CardDescription>
                Visualize, edite planos e gerencie permissões.
              </CardDescription>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Filtrar Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-600">Usuário</TableHead>
                  <TableHead className="font-semibold text-gray-600">Empresa</TableHead>
                  <TableHead className="font-semibold text-gray-600">Plano</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600">Recursos</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600">Admin</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600 pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      Nenhum usuário encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{user.fullName || "Sem nome"}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700 font-medium">
                          {user.companyName || <span className="text-muted-foreground italic">Sem empresa</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.planId}
                          onValueChange={(value) => handleChangePlan(user.companyId, value, user.fullName || user.email)}
                          disabled={!user.companyId}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.hasDisparador ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[10px]">
                            <CheckCircle className="h-3 w-3" /> Disparador
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={user.isSuperAdmin}
                          onCheckedChange={() => 
                            handleToggleAdmin(user.id, user.fullName || user.email, user.isSuperAdmin)
                          }
                          aria-label="Toggle Admin"
                        />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O usuário <strong>{user.fullName || user.email}</strong> será removido permanentemente. 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDeleteUser(user.id, user.fullName || user.email)}
                              >
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Legenda simples no rodapé */}
          <div className="flex gap-6 mt-4 text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Disparador Ativo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <span>Sem acesso</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}