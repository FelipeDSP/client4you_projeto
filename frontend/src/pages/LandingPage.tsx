import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Search, Send, Bot, ArrowRight, Zap, Users, TrendingUp, Shield } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { plans } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  
  // Redireciona usuários logados para o dashboard
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-white font-bold">
              C4Y
            </div>
            <span className="text-xl font-bold">Client4you</span>
          </div>
          
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Preços
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2">
                Começar Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          <Badge variant="secondary" className="text-sm">
            🚀 Captação Inteligente de Clientes
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Do Lead à Conversão<br />
            <span className="text-primary">em Minutos</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Plataforma completa para encontrar, contatar e converter clientes em escala.
            Extrator de leads + Disparador WhatsApp + Automação com IA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg h-12 px-8 gap-2">
                Começar Grátis por 7 Dias
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                Ver Planos
              </Button>
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            ✓ Sem cartão de crédito  ✓ Cancele quando quiser  ✓ Setup em 5 minutos
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container py-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-20">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para captar mais clientes?
          </h2>
          <p className="text-xl text-muted-foreground">
            Junte-se a centenas de profissionais que já estão escalando suas vendas com Client4you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg h-12 px-8 gap-2">
                Começar Grátis por 7 Dias
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                Ver Planos e Preços
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-white font-bold">
                  C4Y
                </div>
                <span className="font-bold">Client4you</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Captação inteligente de clientes para profissionais e empresas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-primary">Preços</a></li>
                <li><Link to="/signup" className="hover:text-primary">Começar Grátis</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
                <li><a href="mailto:suporte@client4you.com.br" className="hover:text-primary">Contato</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/termos" className="hover:text-primary">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-primary">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Client4you. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
