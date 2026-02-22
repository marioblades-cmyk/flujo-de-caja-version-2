import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Loader2, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña." });
        setMode("login");
      }
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      if (!nombre.trim()) {
        toast({ title: "Error", description: "Ingresa tu nombre", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, nombre.trim().toUpperCase());
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Cuenta creada", description: "Revisa tu email para confirmar tu cuenta." });
        setMode("login");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display tracking-wider text-foreground">FLUJO DE CAJA</h1>
          <p className="text-sm text-muted-foreground mt-1">Tienda de Mangas & Comics</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="text-2xl font-display tracking-wider text-center text-foreground">
            {mode === "login" ? "INICIAR SESIÓN" : mode === "signup" ? "CREAR CUENTA" : "RECUPERAR CONTRASEÑA"}
          </h2>

          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tu Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: Mario"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full py-5 text-base" disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "login" ? (
              "Entrar"
            ) : mode === "signup" ? (
              "Crear Cuenta"
            ) : (
              "Enviar Enlace"
            )}
          </Button>

          <div className="text-center space-y-2 text-sm">
            {mode === "login" && (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline block mx-auto">
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline">
                    Crear cuenta
                  </button>
                </p>
              </>
            )}
            {(mode === "signup" || mode === "forgot") && (
              <p className="text-muted-foreground">
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                  Volver al login
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
