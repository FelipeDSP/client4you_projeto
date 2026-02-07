import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { User as SupabaseUser, Session, RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias para logout
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Gerar token único para a sessão
function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Chave para armazenar o token localmente
const SESSION_TOKEN_KEY = 'app_session_token';

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    companyId: data.company_id,
    // Backwards compatible
    name: data.full_name || data.email.split("@")[0],
    company: "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Função para deslogar por sessão remota
  const handleRemoteLogout = useCallback(async () => {
    console.log('[useAuth] Sessão invalidada - deslogando...');
    localStorage.removeItem(SESSION_TOKEN_KEY);
    
    // Remover subscription antes de deslogar
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    
    toast({
      title: "Sessão encerrada",
      description: "Sua conta foi acessada em outro dispositivo. Por segurança, você foi desconectado.",
      variant: "destructive",
      duration: 10000,
    });
  }, []);

  // Configurar Realtime para escutar mudanças no session_token
  const setupRealtimeSubscription = useCallback((userId: string) => {
    // Remover subscription anterior se existir
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const localToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!localToken) return;

    console.log('[useAuth] Configurando Realtime para user:', userId);

    const channel = supabase
      .channel(`profile-session-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useAuth] Realtime - Mudança detectada:', payload);
          const newToken = payload.new?.session_token;
          const currentLocalToken = localStorage.getItem(SESSION_TOKEN_KEY);
          
          // Se o token mudou e é diferente do nosso, fomos deslogados
          if (newToken && currentLocalToken && newToken !== currentLocalToken) {
            console.log('[useAuth] Token mudou! Deslogando...');
            handleRemoteLogout();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useAuth] Realtime status:', status);
      });

    realtimeChannelRef.current = channel;
  }, [handleRemoteLogout]);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const profile = await fetchUserProfile(newSession.user.id);
            setUser(profile);
            setIsLoading(false);
            
            // Configurar Realtime após carregar o perfil
            setupRealtimeSubscription(newSession.user.id);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
          
          // Limpar subscription quando deslogar
          if (realtimeChannelRef.current) {
            supabase.removeChannel(realtimeChannelRef.current);
            realtimeChannelRef.current = null;
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        const profile = await fetchUserProfile(existingSession.user.id);
        setUser(profile);
        
        // Verificar se o token local ainda é válido
        const localToken = localStorage.getItem(SESSION_TOKEN_KEY);
        if (localToken) {
          const { data } = await supabase
            .from("profiles")
            .select("session_token")
            .eq("id", existingSession.user.id)
            .single();
          
          if (data?.session_token && data.session_token !== localToken) {
            // Token diferente, sessão foi invalidada
            handleRemoteLogout();
            return;
          }
        }
        
        // Configurar Realtime
        setupRealtimeSubscription(existingSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [setupRealtimeSubscription, handleRemoteLogout]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Gerar novo token de sessão e salvar no perfil
      if (data.user) {
        const newToken = generateSessionToken();
        console.log('[useAuth] Novo token de sessão gerado:', newToken);
        localStorage.setItem(SESSION_TOKEN_KEY, newToken);
        
        // Atualizar token no banco (isso invalida outras sessões INSTANTANEAMENTE via Realtime)
        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({ 
            session_token: newToken,
            last_login_at: new Date().toISOString()
          })
          .eq("id", data.user.id)
          .select();
        
        if (updateError) {
          console.error("[useAuth] Erro ao atualizar token de sessão:", updateError);
        } else {
          console.log("[useAuth] Token de sessão atualizado com sucesso");
        }
        
        // Configurar Realtime para esta sessão
        setupRealtimeSubscription(data.user.id);
      }

      return { success: true };
    } catch (err) {
      console.error("[useAuth] Erro no login:", err);
      return { success: false, error: "Erro ao fazer login" };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName || email.split("@")[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { success: true, error: "Verifique seu email para confirmar o cadastro" };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Erro ao criar conta" };
    }
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    
    // Limpar subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Limpa o cache do status de admin
    sessionStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, signUp, logout, signOut: logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
