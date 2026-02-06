import { 
  LayoutDashboard, 
  Search, 
  History, 
  Settings, 
  User, 
  MessageSquare, 
  LogOut,
  ShieldCheck,
  Bot,
  Lock,
  Crown
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Itens base (sempre visíveis)
const baseItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    requiredPlan: null,
  },
  {
    title: "Buscar Leads",
    url: "/search",
    icon: Search,
    requiredPlan: null,
  },
  {
    title: "Histórico",
    url: "/history",
    icon: History,
    requiredPlan: null,
  },
];

// Itens com controle de acesso
const featureItems = [
  {
    title: "Disparador",
    url: "/disparador",
    icon: MessageSquare,
    requiredPlan: 'intermediario' as const,
    feature: 'disparador' as const,
  },
  {
    title: "Agente IA",
    url: "/agente-ia",
    icon: Bot,
    requiredPlan: 'avancado' as const,
    feature: 'agente' as const,
    badge: "Beta",
  },
];

// Itens de conta
const accountItems = [
  {
    title: "Perfil",
    url: "/profile",
    icon: User,
    requiredPlan: null,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    requiredPlan: null,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, isLoading } = useAdmin();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center justify-center">
          <img 
            src="/client4you-logo-white.png" 
            alt="Client4you" 
            className="h-8 w-auto group-data-[collapsible=icon]:h-6"
          />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {!isLoading && isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/admin"}
                    tooltip="Administração"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Link to="/admin">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Administração</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-red-600 gap-2 group-data-[collapsible=icon]:justify-center"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}