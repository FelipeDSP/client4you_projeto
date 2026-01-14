import { useState } from "react";
import { Header } from "@/components/Header";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { plans } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Building2, 
  ShieldCheck, 
  ShieldX, 
  RefreshCw,
  Crown,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Admin() {
  const {
    isAdmin,
    isLoading,
    users,
    companies,
    addAdminRole,
    removeAdminRole,
    updateCompanyPlan,
    resetDemoUsage,
    refreshData,
  } = useAdmin();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    toast({ title: "Dados atualizados!" });
  };

  const handleAddAdmin = async (userId: string, userName: string) => {
    const success = await addAdminRole(userId);
    if (success) {
      toast({
        title: "Admin adicionado",
        description: `${userName} agora é um administrador.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o admin.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async (userId: string, userName: string) => {
    const success = await removeAdminRole(userId);
    if (success) {
      toast({
        title: "Admin removido",
        description: `${userName} não é mais um administrador.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível remover o admin.",
        variant: "destructive",
      });
    }
  };

  const handleChangePlan = async (companyId: string, planId: string, companyName: string) => {
    const success = await updateCompanyPlan(companyId, planId);
    if (success) {
      toast({
        title: "Plano atualizado",
        description: `${companyName} agora está no plano ${plans.find(p => p.id === planId)?.name}.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleResetDemo = async (companyId: string, companyName: string) => {
    const success = await resetDemoUsage(companyId);
    if (success) {
      toast({
        title: "Demo resetado",
        description: `O uso demo de ${companyName} foi resetado.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível resetar o demo.",
        variant: "destructive",
      });
    }
  };

  const adminUsers = users.filter(u => u.roles.includes("super_admin"));
  const regularUsers = users.filter(u => !u.roles.includes("super_admin"));

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
              Gerencie usuários, empresas e assinaturas
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {adminUsers.length} admin(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">
                {companies.filter(c => c.subscription?.status === "active").length} ativas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Planos Pagos</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter(c => c.subscription?.planId !== "demo").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {companies.filter(c => c.subscription?.planId === "demo").length} em demo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Admins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Administradores
                </CardTitle>
                <CardDescription>
                  Usuários com acesso total ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum administrador encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((adminUser) => (
                        <TableRow key={adminUser.id}>
                          <TableCell className="font-medium">
                            {adminUser.fullName || "Sem nome"}
                            <Badge variant="default" className="ml-2">Admin</Badge>
                          </TableCell>
                          <TableCell>{adminUser.email}</TableCell>
                          <TableCell>{adminUser.companyName || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(adminUser.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <ShieldX className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {adminUser.fullName || adminUser.email} perderá acesso ao painel admin.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveAdmin(adminUser.id, adminUser.fullName || adminUser.email)}
                                  >
                                    Remover
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
              </CardContent>
            </Card>

            {/* Regular Users */}
            <Card>
              <CardHeader>
                <CardTitle>Todos os Usuários</CardTitle>
                <CardDescription>
                  Lista de todos os usuários cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regularUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      regularUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.fullName || "Sem nome"}
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.companyName || "-"}</TableCell>
                          <TableCell>
                            {u.roles.length > 0 ? (
                              u.roles.map((role) => (
                                <Badge key={role} variant="secondary" className="mr-1">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tornar administrador?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.fullName || u.email} terá acesso total ao painel admin.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleAddAdmin(u.id, u.fullName || u.email)}
                                  >
                                    Confirmar
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Empresas Cadastradas</CardTitle>
                <CardDescription>
                  Gerencie planos e assinaturas das empresas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Demo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhuma empresa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="text-muted-foreground">{company.slug}</TableCell>
                          <TableCell>{company.membersCount}</TableCell>
                          <TableCell>
                            <Select
                              value={company.subscription?.planId || "demo"}
                              onValueChange={(value) => handleChangePlan(company.id, value, company.name)}
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
                          <TableCell>
                            <Badge
                              variant={company.subscription?.status === "active" ? "default" : "secondary"}
                            >
                              {company.subscription?.status || "inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={company.subscription?.demoUsed ? "destructive" : "outline"}>
                              {company.subscription?.demoUsed ? "Usado" : "Disponível"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {company.subscription?.demoUsed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetDemo(company.id, company.name)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Resetar Demo
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
