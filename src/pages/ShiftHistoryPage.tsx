import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCashFlow } from "@/hooks/useCashFlow";
import ShiftDetailDialog from "@/components/ShiftDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESPONSABLES } from "@/types/cash";
import type { Shift } from "@/types/cash";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Clock,
  User,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function ShiftHistoryPage() {
  const {
    shifts,
    currentShift,
    reopenShift,
    updateTransaction,
    deleteTransaction,
    deleteShift,
    updateShift,
    getShiftFinalBalance,
    loading,
  } = useCashFlow();

  const navigate = useNavigate();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [filterResponsable, setFilterResponsable] = useState<string>("ALL");
  const [filterFecha, setFilterFecha] = useState("");

  // Combine closed shifts + current open shift for full list
  // chronological order for lookup
  const allShifts = [...shifts, ...(currentShift ? [currentShift] : [])];
  const sorted = [...allShifts].reverse();

  // Build a map: shiftId -> previous shift's final balance (chronological)
  const prevFinalBalanceMap = new Map<string, number>();
  for (let i = 1; i < allShifts.length; i++) {
    const prevBalance = getShiftFinalBalance(allShifts[i - 1]);
    prevFinalBalanceMap.set(allShifts[i].id, prevBalance);
  }

  const filtered = sorted.filter((s) => {
    if (filterResponsable !== "ALL" && s.responsable !== filterResponsable) return false;
    if (filterFecha && s.fecha !== filterFecha) return false;
    return true;
  });

  const handleReopen = async (shiftId: string) => {
    const success = await reopenShift(shiftId);
    if (success) navigate("/");
    return success;
  };

  // Keep selectedShift in sync with updated data
  const activeSelectedShift = selectedShift
    ? allShifts.find((s) => s.id === selectedShift.id) || selectedShift
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-display tracking-wider text-foreground leading-none">
              HISTORIAL DE TURNOS
            </h1>
            <p className="text-sm text-muted-foreground">Tienda de Mangas & Comics</p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterResponsable} onValueChange={setFilterResponsable}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {RESPONSABLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterFecha}
            onChange={(e) => setFilterFecha(e.target.value)}
            className="w-44"
          />
          {filterFecha && (
            <Button variant="ghost" size="sm" onClick={() => setFilterFecha("")}>
              Limpiar fecha
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No se encontraron turnos</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
            {filtered.map((shift) => {
              const finalBalance = getShiftFinalBalance(shift);
              const totalIn = shift.transactions
                .filter((t) => t.tipo === "INGRESO")
                .reduce((s, t) => s + t.monto, 0);
              const totalOut = shift.transactions
                .filter((t) => t.tipo === "EGRESO")
                .reduce((s, t) => s + t.monto, 0);

              const prevFinal = prevFinalBalanceMap.get(shift.id);
              const diff = prevFinal != null ? shift.montoInicial - prevFinal : null;
              const isMatch = diff !== null && Math.abs(diff) < 0.01;

              return (
                <div
                  key={shift.id}
                  className="px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedShift(shift)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{shift.responsable}</span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold">
                          {shift.turno}
                        </span>
                        {!shift.cerrado && (
                          <span className="px-2 py-0.5 rounded-md bg-success/20 text-success text-xs font-semibold">
                            ABIERTO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {shift.fecha} · {shift.horaApertura}
                          {shift.horaCierre ? ` — ${shift.horaCierre}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs mt-1">
                        <span className="flex items-center gap-1 text-success">
                          <ArrowUpCircle className="w-3 h-3" /> +Bs {totalIn.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <ArrowDownCircle className="w-3 h-3" /> -Bs {totalOut.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          {shift.transactions.length} mov.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Saldo final</p>
                        <p className="font-display text-lg text-foreground">
                          Bs {finalBalance.toFixed(2)}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  {/* Opening vs previous close check */}
                  {prevFinal != null && (
                    <div className={`flex items-center gap-2 text-xs mt-2 px-2 py-1.5 rounded-md ${
                      isMatch
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {isMatch ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Abrió con Bs {shift.montoInicial.toFixed(2)} — correcto</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Turno anterior cerró con Bs {prevFinal.toFixed(2)}, pero este abrió con Bs {shift.montoInicial.toFixed(2)}
                            {" "}({diff! > 0 ? "+" : ""}{diff!.toFixed(2)})
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeSelectedShift && (
          <ShiftDetailDialog
            shift={activeSelectedShift}
            open={!!activeSelectedShift}
            onOpenChange={(open) => !open && setSelectedShift(null)}
            hasOpenShift={!!currentShift}
            onReopen={handleReopen}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            onDeleteShift={deleteShift}
            onUpdateShift={updateShift}
            getShiftFinalBalance={getShiftFinalBalance}
          />
        )}
      </main>
    </div>
  );
}
