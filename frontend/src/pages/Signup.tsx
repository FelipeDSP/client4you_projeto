import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Preencha todos os campos");
      return false;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, formData.fullName);

      if (result.success) {
        if (result.error?.includes("email")) {
          // Confirmação de email necessária
          setSuccess(true);
        } else {
          // Login automático após criar conta
          navigate("/dashboard");
        }
      } else {
        setError(result.error || "Erro ao criar conta");
      }
    } catch (err) {
      setError("Erro ao processar cadastro");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,170,0,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(0,102,204,0.1),transparent_50%)]" />
        
        <Card className="relative w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-white">Email Enviado!</CardTitle>
            <CardDescription className="text-slate-400">
              Verifique sua caixa de entrada para confirmar seu cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-slate-700 bg-slate-900/50">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-slate-300">
                Enviamos um link de confirmação para <strong>{formData.email}</strong>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-slate-400 text-center">
              Não recebeu? Verifique sua pasta de spam ou{" "}
              <button className="text-primary hover:underline">
                reenviar email
              </button>
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Voltar para Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,170,0,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(0,102,204,0.1),transparent_50%)]" />
      
      <Card className="relative w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/leads4you-logo.png" 
              alt="Leads4you" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl text-white">Criar Conta</CardTitle>
          <CardDescription className="text-slate-400">
            Comece com o plano Demo gratuito (5 buscas de leads)
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-200">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-9 border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9 border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-9 border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-9 border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF8C00] via-[#FFAA00] to-[#FFC300] hover:from-[#FF7700] hover:via-[#FF9500] hover:to-[#FFB800] shadow-lg shadow-orange-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta Grátis"
              )}
            </Button>

            <div className="text-center text-sm text-slate-400">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Ao criar uma conta, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Serviço
              </a>{" "}
              e{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
