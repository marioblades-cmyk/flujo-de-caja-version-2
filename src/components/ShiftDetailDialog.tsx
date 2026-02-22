import { useState } from "react";
import type { Shift, Transaction, TipoMovimiento } from "@/types/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Check,
} from "lucide-react";

interface Props {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasOpenShift: boolean;
  onReopen: (shiftId: string) => Promise<boolean>;
  onUpdateTransaction: (txId: string, data: { concepto?: string; tipo?: TipoMovimiento; monto?: number }) => Promise<boolean>;
  onDeleteTransaction: (txId: string) => Promise<boolean>;
  onDeleteShift: (shiftId: string) => Promise<boolean>;
  getShiftFinalBalance: (shift: Shift) => number;
}

export default function ShiftDetailDialog({
  shift,
  open,
  onOpenChange,
  hasOpenShift,
  onReopen,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteShift,
  getShiftFinalBalance,
}: Props) {
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [editConcepto, setEditConcepto] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editTipo, setEditTipo] = useState<TipoMovimiento>("INGRESO");

  const finalBalance = getShiftFinalBalance(shift);
  const totalIn = shift.transactions.filter((t) => t.tipo === "INGRESO").reduce((s, t) => s + t.monto, 0);
  const totalOut = shift.transactions.filter((t) => t.tipo === "EGRESO").reduce((s, t) => s + t.monto, 0);

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx.id);
    setEditConcepto(tx.concepto);
    setEditMonto(tx.monto.toString());
    setEditTipo(tx.tipo);
  };

  const saveEdit = async () => {
    if (!editingTx) return;
    await onUpdateTransaction(editingTx, {
      concepto: editConcepto,
      tipo: editTipo,
      monto: parseFloat(editMonto),
    });
    setEditingTx(null);
  };

  const handleReopen = async () => {
    const success = await onReopen(shift.id);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider">
            DETALLE DEL TURNO
          </DialogTitle>
          <DialogDescription>
            {shift.fecha} · {shift.responsable} · {shift.turno}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Inicio</p>
            <p className="font-display text-lg">Bs {shift.montoInicial.toFixed(2)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Ingresos</p>
            <p className="font-display text-lg text-success">+Bs {totalIn.toFixed(2)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Egresos</p>
            <p className="font-display text-lg text-destructive">-Bs {totalOut.toFixed(2)}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
            <p className="text-xs text-primary uppercase font-semibold">Saldo Final</p>
            <p className="font-display text-lg text-primary">Bs {finalBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex gap-4">
          <span>Apertura: {shift.horaApertura}</span>
          {shift.horaCierre && <span>Cierre: {shift.horaCierre}</span>}
          <span>{shift.cerrado ? "● Cerrado" : "● Abierto"}</span>
        </div>

        {/* Transactions */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/50">
            <h4 className="font-display text-sm tracking-wider">MOVIMIENTOS ({shift.transactions.length})</h4>
          </div>
          {shift.transactions.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground text-sm">Sin movimientos</p>
          ) : (
            <div className="divide-y divide-border">
              {shift.transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3">
                  {editingTx === tx.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTipo("INGRESO")}
                          className={`px-3 py-1 rounded text-xs font-semibold border ${
                            editTipo === "INGRESO"
                              ? "bg-success text-success-foreground border-success"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          INGRESO
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTipo("EGRESO")}
                          className={`px-3 py-1 rounded text-xs font-semibold border ${
                            editTipo === "EGRESO"
                              ? "bg-destructive text-destructive-foreground border-destructive"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          EGRESO
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={editConcepto}
                          onChange={(e) => setEditConcepto(e.target.value)}
                          className="flex-1"
                          placeholder="Concepto"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editMonto}
                          onChange={(e) => setEditMonto(e.target.value)}
                          className="w-28"
                          placeholder="Monto"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="gap-1">
                          <Check className="w-3 h-3" /> Guardar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTx(null)} className="gap-1">
                          <X className="w-3 h-3" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {tx.tipo === "INGRESO" ? (
                          <ArrowUpCircle className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-destructive shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{tx.concepto}</p>
                          <p className="text-xs text-muted-foreground">{tx.hora}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`font-semibold text-sm ${tx.tipo === "INGRESO" ? "text-success" : "text-destructive"}`}>
                          {tx.tipo === "INGRESO" ? "+" : "-"}Bs {tx.monto.toFixed(2)}
                        </p>
                        {shift.cerrado && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(tx)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Se eliminará "{tx.concepto}" por Bs {tx.monto.toFixed(2)}. Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteTransaction(tx.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reopen button */}
        {shift.cerrado && (
          <div className="flex flex-col gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2" disabled={hasOpenShift}>
                  <RotateCcw className="w-4 h-4" />
                  {hasOpenShift ? "No se puede reabrir (hay un turno abierto)" : "Reabrir Caja"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reabrir esta caja?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se reabrirá el turno de {shift.responsable} ({shift.fecha} - {shift.turno}).
                    Aparecerá como turno activo en la página principal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReopen}>Sí, reabrir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="w-4 h-4" /> Eliminar Turno Completo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este turno?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará permanentemente el turno de {shift.responsable} ({shift.fecha} - {shift.turno})
                    junto con todos sus {shift.transactions.length} movimientos. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await onDeleteShift(shift.id);
                      onOpenChange(false);
                    }}
                  >
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
