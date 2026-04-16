import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Landmark } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate Supabase Auth
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[40%] bg-sidebar flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-2 border-sidebar-foreground" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border-2 border-sidebar-foreground" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full border-2 border-sidebar-foreground" />
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-sidebar-accent flex items-center justify-center">
            <Landmark className="w-10 h-10 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-sidebar-foreground tracking-tight uppercase">
              Portal de Transparência
            </h1>
            <p className="text-lg font-heading font-semibold text-brand-orange tracking-wide mt-1">
              Forte Mais
            </p>
          </div>
          <p className="text-sidebar-foreground/70 max-w-xs text-sm leading-relaxed">
            Plataforma integrada para gestão e prestação de contas de recursos públicos.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-card">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">PNAE Digital</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Acesse sua conta
            </h2>
            <p className="text-muted-foreground text-sm">
              Sistema PNAE — Gestão de Prestação de Contas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="brand" className="w-full h-11 text-base">
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Esqueceu a senha?{" "}
            <span className="text-brand-purple cursor-pointer hover:underline">
              Recuperar acesso
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
