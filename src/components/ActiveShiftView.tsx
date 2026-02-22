import { useState } from "react";
import type { TipoMovimiento, Shift, Turno, Responsable } from "@/types/cash";
import { TURNOS, RESPONSABLES } from "@/types/cash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowUpCircle, ArrowDownCircle, DoorClosed, Pencil, Trash2, Check, X } from "lucide-react";
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

interface Props {
  shift: Shift;
  currentBalance: number;
  onAddTransaction: (concepto: string, tipo: TipoMovimiento, monto: number) => void;
  onClose: () => void;
  onUpdateTransaction: (txId: string, data: { concepto?: string; tipo?: TipoMovimiento; monto?: number }) => Promise<boolean>;
  onDeleteTransaction: (txId: string) => Promise<boolean>;
  onUpdateShift: (shiftId: string, data: { turno?: string; responsable?: string; monto_inicial?: number }) => Promise<boolean>;
}

export default function ActiveShiftView({
  shift,
  currentBalance,
  onAddTransaction,
  onClose,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateShift,
}: Props) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState<TipoMovimiento>("INGRESO");

  // Edit shift header state
  const [editingHeader, setEditingHeader] = useState(false);
  const [editTurno, setEditTurno] = useState(shift.turno);
  const [editResponsable, setEditResponsable] = useState(shift.responsable);
  const [editMontoInicial, setEditMontoInicial] = useState(shift.montoInicial.toString());

  // Edit transaction state
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [editTxConcepto, setEditTxConcepto] = useState("");
  const [editTxMonto, setEditTxMonto] = useState("");
  const [editTxTipo, setEditTxTipo] = useState<TipoMovimiento>("INGRESO");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || !monto) return;
    onAddTransaction(concepto, tipo, parseFloat(monto));
    setConcepto("");
    setMonto("");
  };

  const startEditHeader = () => {
    setEditTurno(shift.turno);
    setEditResponsable(shift.responsable);
    setEditMontoInicial(shift.montoInicial.toString());
    setEditingHeader(true);
  };

  const saveHeader = async () => {
    await onUpdateShift(shift.id, {
      turno: editTurno,
      responsable: editResponsable,
      monto_inicial: parseFloat(editMontoInicial),
    });
    setEditingHeader(false);
  };

  const startEditTx = (tx: { id: string; concepto: string; monto: number; tipo: TipoMovimiento }) => {
    setEditingTx(tx.id);
    setEditTxConcepto(tx.concepto);
    setEditTxMonto(tx.monto.toString());
    setEditTxTipo(tx.tipo);
  };

  const saveTx = async () => {
    if (!editingTx) return;
    await onUpdateTransaction(editingTx, {
      concepto: editTxConcepto,
      tipo: editTxTipo,
      monto: parseFloat(editTxMonto),
    });
    setEditingTx(null);
  };

  const totalIngresos = shift.transactions
    .filter((t) => t.tipo === "INGRESO")
    .reduce((s, t) => s + t.monto, 0);
  const totalEgresos = shift.transactions
    .filter((t) => t.tipo === "EGRESO")
    .reduce((s, t) => s + t.monto, 0);

  return (
    <div className="space-y-5">
      {/* Shift header */}
      <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
        {editingHeader ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Editar Datos del Turno</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Turno</label>
                <Select value={editTurno} onValueChange={(v) => setEditTurno(v as Turno)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TURNOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Responsable</label>
                <Select value={editResponsable} onValueChange={(v) => setEditResponsable(v as Responsable)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESPONSABLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Monto Inicial (Bs)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editMontoInicial}
                  onChange={(e) => setEditMontoInicial(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveHeader} className="gap-1">
                <Check className="w-3 h-3" /> Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingHeader(false)} className="gap-1">
                <X className="w-3 h-3" /> Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Caja Abierta</p>
                <p className="font-display text-xl tracking-wider">
                  {shift.responsable} — {shift.turno}
                </p>
                <p className="text-xs text-muted-foreground">{shift.fecha} · Apertura: {shift.horaApertura}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={startEditHeader} className="gap-1">
                <Pencil className="w-3 h-3" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <DoorClosed className="w-4 h-4" /> Cerrar Caja
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cerrar la caja?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El saldo final será <strong>Bs {currentBalance.toFixed(2)}</strong>.
                      Esta acción finalizará el turno de <strong>{shift.responsable}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onClose}>Sí, cerrar caja</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Inicio</p>
          <p className="font-display text-xl">Bs {shift.montoInicial.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-xs text-success uppercase font-semibold">Ingresos</p>
          <p className="font-display text-xl text-success">+Bs {totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-xs text-destructive uppercase font-semibold">Egresos</p>
          <p className="font-display text-xl text-destructive">-Bs {totalEgresos.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-primary/30 text-center bg-primary/5">
          <p className="text-xs text-primary uppercase font-semibold">Saldo Actual</p>
          <p className="font-display text-xl text-primary">Bs {currentBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Add transaction */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-4">
        <h2 className="text-xl font-display tracking-wider text-primary">REGISTRAR MOVIMIENTO</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipo("INGRESO")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-colors border ${
              tipo === "INGRESO"
                ? "bg-success text-success-foreground border-success"
                : "bg-card text-muted-foreground border-border hover:border-success/50"
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" /> INGRESO
          </button>
          <button
            type="button"
            onClick={() => setTipo("EGRESO")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-colors border ${
              tipo === "EGRESO"
                ? "bg-destructive text-destructive-foreground border-destructive"
                : "bg-card text-muted-foreground border-border hover:border-destructive/50"
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" /> EGRESO
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Concepto</label>
            <Input placeholder="Descripción del movimiento" value={concepto} onChange={(e) => setConcepto(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monto (Bs)</label>
            <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto gap-2">
          <Plus className="w-4 h-4" /> Agregar
        </Button>
      </form>

      {/* Transaction list */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-display text-lg tracking-wider text-foreground">MOVIMIENTOS DEL TURNO</h3>
        </div>
        {shift.transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Sin movimientos aún</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {shift.transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3">
                {editingTx === tx.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTxTipo("INGRESO")}
                        className={`px-3 py-1 rounded text-xs font-semibold border ${
                          editTxTipo === "INGRESO"
                            ? "bg-success text-success-foreground border-success"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        INGRESO
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditTxTipo("EGRESO")}
                        className={`px-3 py-1 rounded text-xs font-semibold border ${
                          editTxTipo === "EGRESO"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        EGRESO
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Input value={editTxConcepto} onChange={(e) => setEditTxConcepto(e.target.value)} className="flex-1" placeholder="Concepto" />
                      <Input type="number" step="0.01" min="0.01" value={editTxMonto} onChange={(e) => setEditTxMonto(e.target.value)} className="w-28" placeholder="Monto" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveTx} className="gap-1"><Check className="w-3 h-3" /> Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingTx(null)} className="gap-1"><X className="w-3 h-3" /> Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tx.tipo === "INGRESO" ? (
                        <ArrowUpCircle className="w-5 h-5 text-success shrink-0" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-destructive shrink-0" />
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
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditTx(tx)}>
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
                                Se eliminará "{tx.concepto}" por Bs {tx.monto.toFixed(2)}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteTransaction(tx.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
