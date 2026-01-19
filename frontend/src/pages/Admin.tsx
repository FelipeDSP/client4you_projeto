import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { plans } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
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
      // 1. Create user in Supabase Auth using admin API
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

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // 2. Wait a bit for the trigger to create the company and subscription
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Find the company created for this user
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authData.user.id)
        .single();

      if (profileData?.company_id) {
        // 4. Update the subscription plan
        await supabase
          .from("subscriptions")
          .update({ plan_id: newUserPlan })
          .eq("company_id", profileData.company_id);
      }

      toast({
        title: "Usuário criado!",
        description: `${newUserEmail} foi criado com sucesso.`,
      });

      // Reset form
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-primary" />
              Painel Admin
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários e planos
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            
            {/* Create User Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie uma conta para um novo cliente
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
                    <p className="text-xs text-muted-foreground">
                      Professional e Business têm acesso ao Disparador
                    </p>
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {totalAdmins} admin(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Com Disparador</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{professionalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Plano Professional ou Business
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">
                {companies.filter((c) => c.subscription?.status === "active").length} ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Contas</CardTitle>
            <CardDescription>
              Altere planos e permissões dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-center">Disparador</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.fullName || "Sem nome"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.companyName || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.planId}
                            onValueChange={(value) => handleChangePlan(user.companyId, value, user.fullName || user.email)}
                            disabled={!user.companyId}
                          >
                            <SelectTrigger className="w-32">
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
                            <Badge variant="default" className="bg-green-600 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Não
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={user.isSuperAdmin}
                            onCheckedChange={() => 
                              handleToggleAdmin(user.id, user.fullName || user.email, user.isSuperAdmin)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{user.fullName || user.email}</strong> será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteUser(user.id, user.fullName || user.email)}
                                >
                                  Excluir
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

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Sim
                </Badge>
                <span>= Acesso ao Disparador (Professional/Business)</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked disabled className="opacity-50" />
                <span>= Super Admin (acesso a este painel)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
