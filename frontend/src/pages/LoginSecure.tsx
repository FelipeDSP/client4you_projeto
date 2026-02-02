import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, Lock, AlertCircle, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Cloudflare Turnstile site key
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAACW4RDfzQ0vdBVOB";

// Backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

// Simple email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Format seconds to readable time
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
};

export default function LoginSecure() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Countdown timer for blocked state
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setBlockMessage("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  // Load Cloudflare Turnstile script
  useEffect(() => {
    // Check if script already loaded
    if (document.getElementById('turnstile-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (turnstileWidgetId.current && (window as any).turnstile) {
        (window as any).turnstile.remove(turnstileWidgetId.current);
      }
    };
  }, []);

  // Render Turnstile when showCaptcha changes
  useEffect(() => {
    if (showCaptcha && turnstileRef.current && (window as any).turnstile) {
      // Remove existing widget if any
      if (turnstileWidgetId.current) {
        try {
          (window as any).turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
          console.log('Error removing turnstile:', e);
        }
      }

      // Render new widget
      try {
        turnstileWidgetId.current = (window as any).turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'error-callback': () => {
            setTurnstileToken(null);
            toast({
              title: "❌ Erro na verificação",
              description: "Não foi possível validar a verificação. Por favor, recarregue a página e tente novamente.",
              variant: "destructive",
            });
          },
          theme: 'dark',
        });
      } catch (e) {
        console.error('Error rendering turnstile:', e);
      }
    }
  }, [showCaptcha, toast]);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("O email é obrigatório");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Digite um email válido");
      isValid = false;
    }

    if (!password) {
      setPasswordError("A senha é obrigatória");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("A senha deve ter no mínimo 6 caracteres");
      isValid = false;
    }

    return isValid;
  };

  const checkLoginAllowed = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/security/validate-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          turnstile_token: turnstileToken,
        }),
      });

      const data = await response.json();

      if (!data.allowed) {
        setIsBlocked(true);
        setBlockMessage(data.reason || "Login temporariamente bloqueado");
        setRetryAfter(data.retry_after || 0);
        return false;
      }

      // Se precisa CAPTCHA mas ainda não está mostrando, mostrar agora
      if (data.show_captcha && !showCaptcha && !turnstileToken) {
        setShowCaptcha(true);
        toast({
          title: "⚠️ Verificação de segurança necessária",
          description: "Por favor, complete a verificação abaixo para continuar.",
        });
        return false; // Impede submit até CAPTCHA ser completado
      }

      return true;
    } catch (error) {
      console.error('Error checking login:', error);
      // Allow login if security check fails (fail-open)
      return true;
    }
  };

  const recordLoginAttempt = async (success: boolean, failureReason?: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/security/record-login-attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          success,
          failure_reason: failureReason,
          turnstile_token: turnstileToken,
        }),
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // If CAPTCHA is shown but not completed
    if (showCaptcha && !turnstileToken) {
      toast({
        title: "⚠️ Verificação pendente",
        description: "Por favor, marque a caixa de verificação acima para prosseguir.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    // Check if login is allowed
    const allowed = await checkLoginAllowed();
    if (!allowed) {
      setIsLoading(false);
      return;
    }

    // Attempt login
    const result = await login(email.trim(), password);

    if (result.success) {
      // Record successful login
      await recordLoginAttempt(true);
      
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao Client4you.",
      });
      navigate("/dashboard");
    } else {
      // Record failed login
      await recordLoginAttempt(false, result.error || "Credenciais inválidas");
      
      toast({
        title: "Erro no login",
        description: result.error || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });

      // Reset Turnstile token
      setTurnstileToken(null);
      if (turnstileWidgetId.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.reset(turnstileWidgetId.current);
        } catch (e) {
          console.log('Error resetting turnstile:', e);
        }
      }

      // Re-check if should show CAPTCHA or block after this failure
      setTimeout(async () => {
        const recheckAllowed = await checkLoginAllowed();
        // checkLoginAllowed já atualiza os estados necessários
      }, 500);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,170,0,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(0,102,204,0.1),transparent_50%)]" />
      
      <Card className="relative w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/leads4you-logo.png" 
              alt="Client4you" 
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl text-white">Client4you</CardTitle>
          <CardDescription className="text-slate-400">
            Extraia leads do Google Maps de forma simples e eficiente
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            {/* Blocked Alert */}
            {isBlocked && (
              <Alert variant="destructive" className="border-orange-500/50 bg-orange-950/30">
                <Shield className="h-5 w-5 text-orange-400" />
                <AlertDescription className="space-y-2">
                  <div>
                    <p className="font-bold text-orange-100 text-base">
                      Acesso temporariamente bloqueado
                    </p>
                    <p className="text-sm text-orange-200/80 mt-1">
                      Detectamos muitas tentativas de login incorretas para proteger sua conta.
                    </p>
                  </div>
                  {retryAfter > 0 && (
                    <div className="flex items-center gap-2 bg-orange-900/30 rounded-md p-2 mt-2">
                      <Clock className="h-4 w-4 text-orange-300" />
                      <div className="flex-1">
                        <p className="text-xs text-orange-200/70">Você poderá tentar novamente em:</p>
                        <p className="font-mono font-bold text-orange-100 text-lg">{formatTime(retryAfter)}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-orange-200/60 mt-2">
                    💡 Dica: Aguarde o tempo indicado ou entre em contato com o suporte se precisar de ajuda.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-slate-200">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  disabled={isBlocked || isLoading}
                  className={`border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-400 ${emailError ? "border-red-500" : ""}`}
                />
              </div>
              {emailError && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-slate-200">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  disabled={isBlocked || isLoading}
                  className={`border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-400 ${passwordError ? "border-red-500" : ""}`}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Cloudflare Turnstile */}
            {showCaptcha && (
              <div className="flex justify-center">
                <div ref={turnstileRef} />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF8C00] via-[#FFAA00] to-[#FFC300] hover:from-[#FF7700] hover:via-[#FF9500] hover:to-[#FFB800] shadow-lg shadow-orange-500/20"
              disabled={isLoading || isBlocked}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            
            <div className="text-center text-sm text-slate-400">
              Não tem uma conta?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Criar conta grátis
              </Link>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>Protegido contra ataques automatizados</span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
