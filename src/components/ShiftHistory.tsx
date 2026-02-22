import type { Shift } from "@/types/cash";
import { Clock, User, ArrowUpCircle, ArrowDownCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  shifts: Shift[];
  getShiftFinalBalance: (shift: Shift) => number;
}

export default function ShiftHistory({ shifts, getShiftFinalBalance }: Props) {
  if (shifts.length === 0) return null;

  const recent = [...shifts].reverse().slice(0, 5);

  // Build map of previous shift's final balance (chronological order)
  const prevFinalBalanceMap = new Map<string, number>();
  for (let i = 1; i < shifts.length; i++) {
    prevFinalBalanceMap.set(shifts[i].id, getShiftFinalBalance(shifts[i - 1]));
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-display text-lg tracking-wider text-foreground">HISTORIAL DE TURNOS</h3>
      </div>
      <div className="divide-y divide-border">
        {recent.map((shift) => {
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
            <div key={shift.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{shift.responsable}</span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold">
                      {shift.turno}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{shift.fecha} · {shift.horaApertura} — {shift.horaCierre}</span>
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
                  {prevFinal != null && (
                    <div className={`flex items-center gap-2 text-xs mt-1 px-2 py-1 rounded-md ${
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
                            Anterior cerró Bs {prevFinal.toFixed(2)}, abrió Bs {shift.montoInicial.toFixed(2)}
                            {" "}({diff! > 0 ? "+" : ""}{diff!.toFixed(2)})
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo final</p>
                  <p className="font-display text-lg text-foreground">Bs {finalBalance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
