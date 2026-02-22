import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await updatePassword(password);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
      navigate("/");
    }
    setSubmitting(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Enlace inválido o expirado.</p>
          <Button className="mt-4" onClick={() => navigate("/auth")}>Ir al login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display tracking-wider text-foreground">NUEVA CONTRASEÑA</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
            </div>
          </div>
          <Button type="submit" className="w-full py-5" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
