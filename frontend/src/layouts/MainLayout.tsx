// Exemplo de estrutura para src/layouts/MainLayout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar" // Você precisará criar este componente com o menu
import { Bell, User } from "lucide-react"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50"> {/* Fundo geral cinza claro */}
        <AppSidebar /> {/* Sua Sidebar Azul */}
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-800">
                {/* Título da página dinâmico pode vir aqui */}
                Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Ícone de Notificação com Badge */}
               <div className="relative cursor-pointer text-gray-500 hover:text-green-600 transition">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
               </div>
               
               {/* Avatar do Usuário */}
               <div className="flex items-center gap-2 pl-4 border-l">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    FD
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">Felipe</span>
               </div>
            </div>
          </header>

          {/* Área Principal com Padding Confortável */}
          <div className="flex-1 overflow-auto p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
