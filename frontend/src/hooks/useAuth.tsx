import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
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
  const [wasLoggedOutRemotely, setWasLoggedOutRemotely] = useState(false);

  // Função para verificar se a sessão ainda é válida
  const checkSessionValidity = useCallback(async (userId: string) => {
    try {
      const localToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!localToken) return true; // Se não tem token local, não verifica

      const { data, error } = await supabase
        .from("profiles")
        .select("session_token")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Erro ao verificar sessão:", error);
        return true; // Em caso de erro, não desloga
      }

      // Se o token do servidor é diferente do local, a sessão foi invalidada
      if (data?.session_token && data.session_token !== localToken) {
        return false;
      }

      return true;
    } catch (err) {
      console.warn("Erro ao verificar sessão:", err);
      return true;
    }
  }, []);

  // Função para deslogar por sessão remota
  const handleRemoteLogout = useCallback(async () => {
    setWasLoggedOutRemotely(true);
    localStorage.removeItem(SESSION_TOKEN_KEY);
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
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        const profile = await fetchUserProfile(existingSession.user.id);
        setUser(profile);
        
        // Verificar se a sessão ainda é válida
        const isValid = await checkSessionValidity(existingSession.user.id);
        if (!isValid) {
          handleRemoteLogout();
          return;
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSessionValidity, handleRemoteLogout]);

  // Verificar sessão periodicamente (a cada 30 segundos)
  useEffect(() => {
    if (!user?.id || !session) return;

    const intervalId = setInterval(async () => {
      const isValid = await checkSessionValidity(user.id);
      if (!isValid) {
        handleRemoteLogout();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, [user?.id, session, checkSessionValidity, handleRemoteLogout]);

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
        localStorage.setItem(SESSION_TOKEN_KEY, newToken);
        
        // Atualizar token no banco (isso invalida outras sessões)
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            session_token: newToken,
            last_login_at: new Date().toISOString()
          })
          .eq("id", data.user.id);
        
        if (updateError) {
          console.warn("Erro ao atualizar token de sessão:", updateError);
        }
      }

      setWasLoggedOutRemotely(false);
      return { success: true };
    } catch (err) {
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
