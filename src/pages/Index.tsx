import { Link } from "react-router-dom";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useAuth } from "@/hooks/useAuth";
import OpenCashForm from "@/components/OpenCashForm";
import ActiveShiftView from "@/components/ActiveShiftView";
import ShiftHistory from "@/components/ShiftHistory";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, History, LogOut } from "lucide-react";

const Index = () => {
  const { profile, signOut } = useAuth();
  const {
    currentShift,
    shifts,
    lastClosedShift,
    currentBalance,
    openCash,
    addTransaction,
    closeCash,
    updateTransaction,
    deleteTransaction,
    updateShift,
    getShiftFinalBalance,
    loading,
  } = useCashFlow();

  const lastFinalBalance = lastClosedShift
    ? getShiftFinalBalance(lastClosedShift)
    : null;

  const isMyShift = currentShift?.responsable === profile?.nombre;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-display tracking-wider text-foreground leading-none">
              FLUJO DE CAJA
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile?.nombre ? `Hola, ${profile.nombre}` : "Tienda de Mangas & Comics"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/historial">
                <History className="w-4 h-4" /> Historial
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentShift ? (
          isMyShift ? (
            <ActiveShiftView
              shift={currentShift}
              currentBalance={currentBalance!}
              onAddTransaction={addTransaction}
              onClose={closeCash}
              onUpdateTransaction={updateTransaction}
              onDeleteTransaction={deleteTransaction}
              onUpdateShift={updateShift}
            />
          ) : (
            /* Another user's shift - view only */
            <div className="space-y-5">
              <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Caja Abierta por</p>
                    <p className="font-display text-xl tracking-wider">
                      {currentShift.responsable} — {currentShift.turno}
                    </p>
                    <p className="text-xs text-muted-foreground">{currentShift.fecha} · Apertura: {currentShift.horaApertura}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card rounded-xl p-4 border border-border text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Inicio</p>
                  <p className="font-display text-xl">Bs {currentShift.montoInicial.toFixed(2)}</p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border text-center">
                  <p className="text-xs text-success uppercase font-semibold">Ingresos</p>
                  <p className="font-display text-xl text-success">+Bs {currentShift.transactions.filter(t => t.tipo === "INGRESO").reduce((s, t) => s + t.monto, 0).toFixed(2)}</p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border text-center">
                  <p className="text-xs text-destructive uppercase font-semibold">Egresos</p>
                  <p className="font-display text-xl text-destructive">-Bs {currentShift.transactions.filter(t => t.tipo === "EGRESO").reduce((s, t) => s + t.monto, 0).toFixed(2)}</p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-primary/30 text-center bg-primary/5">
                  <p className="text-xs text-primary uppercase font-semibold">Saldo Actual</p>
                  <p className="font-display text-xl text-primary">Bs {currentBalance?.toFixed(2)}</p>
                </div>
              </div>
              {/* Read-only transaction list */}
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="font-display text-lg tracking-wider text-foreground">MOVIMIENTOS DEL TURNO</h3>
                </div>
                {currentShift.transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground"><p>Sin movimientos aún</p></div>
                ) : (
                  <div className="divide-y divide-border">
                    {currentShift.transactions.map((tx) => (
                      <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 shrink-0 ${tx.tipo === "INGRESO" ? "text-success" : "text-destructive"}`}>●</div>
                          <div>
                            <p className="text-sm font-medium">{tx.concepto}</p>
                            <p className="text-xs text-muted-foreground">{tx.hora}</p>
                          </div>
                        </div>
                        <p className={`font-semibold text-sm ${tx.tipo === "INGRESO" ? "text-success" : "text-destructive"}`}>
                          {tx.tipo === "INGRESO" ? "+" : "-"}Bs {tx.monto.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <OpenCashForm
            lastClosedShift={lastClosedShift}
            lastFinalBalance={lastFinalBalance}
            onOpen={openCash}
          />
        )}

        <ShiftHistory shifts={shifts} getShiftFinalBalance={getShiftFinalBalance} />
      </main>
    </div>
  );
};

export default Index;
