import { Home, History, Settings, Send, LogOut, User } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { useLocation, Link } from "react-router-dom"

// Itens do menu
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Disparador",
    url: "/disparador",
    icon: Send,
  },
  {
    title: "Histórico",
    url: "/history",
    icon: History,
  },
  {
    title: "Perfil",
    url: "/profile",
    icon: User,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { signOut } = useAuth()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2 px-2">
          {/* Logo ou Ícone do App */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold">
            LD
          </div>
          <span className="truncate font-semibold text-white">Lead Dispatcher</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    className="hover:bg-sidebar-accent hover:text-white transition-colors"
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => signOut()}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogOut />
              <span>Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
