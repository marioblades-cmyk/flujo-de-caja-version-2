import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Loader2, ArrowLeft, Shield, ShieldOff, Pencil, Trash2, Check, X, UserCheck, UserX
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface AdminUser {
  user_id: string;
  nombre: string;
  email: string;
  active: boolean;
  roles: string[];
  created_at: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const callAdmin = useCallback(async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("admin-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await callAdmin({ action: "list" });
      setUsers(data);
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user, fetchUsers]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return <Navigate to="/" replace />;

  const handleUpdateName = async (userId: string) => {
    try {
      await callAdmin({ action: "update_profile", user_id: userId, nombre: editName.trim().toUpperCase() });
      toast({ title: "Nombre actualizado" });
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (u: AdminUser) => {
    try {
      await callAdmin({ action: "update_profile", user_id: u.user_id, active: !u.active });
      toast({ title: u.active ? "Cuenta desactivada" : "Cuenta activada" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleAdmin = async (u: AdminUser) => {
    try {
      await callAdmin({ action: "toggle_role", user_id: u.user_id, role: "admin" });
      toast({ title: u.roles.includes("admin") ? "Admin removido" : "Admin asignado" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await callAdmin({ action: "delete_user", user_id: userId });
      toast({ title: "Usuario eliminado" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-display tracking-wider text-foreground leading-none">ADMINISTRACIÓN</h1>
            <p className="text-sm text-muted-foreground">Gestión de usuarios</p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/"><ArrowLeft className="w-4 h-4" /> Volver</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-display text-lg tracking-wider text-foreground">USUARIOS ({users.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.user_id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {editingId === u.user_id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-40"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateName(u.user_id)}>
                        <Check className="w-4 h-4 text-success" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base tracking-wider">{u.nombre}</p>
                      {u.roles.includes("admin") && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
                      )}
                      {!u.active && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-semibold">INACTIVO</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Editar nombre"
                    onClick={() => { setEditingId(u.user_id); setEditName(u.nombre); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title={u.active ? "Desactivar cuenta" : "Activar cuenta"}
                    onClick={() => handleToggleActive(u)}
                  >
                    {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title={u.roles.includes("admin") ? "Quitar admin" : "Hacer admin"}
                    onClick={() => handleToggleAdmin(u)}
                  >
                    {u.roles.includes("admin") ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Eliminar usuario">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar a {u.nombre}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción es irreversible. Se eliminará la cuenta y todos sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(u.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
