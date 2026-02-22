import { useState } from "react";
import type { Turno, Shift } from "@/types/cash";
import { TURNOS } from "@/types/cash";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DoorOpen, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  lastClosedShift: Shift | null;
  lastFinalBalance: number | null;
  onOpen: (turno: Turno, responsable: string, montoInicial: number) => void;
}

export default function OpenCashForm({ lastClosedShift, lastFinalBalance, onOpen }: Props) {
  const { profile } = useAuth();
  const [turno, setTurno] = useState<Turno | "">("");
  const [montoInicial, setMontoInicial] = useState("");

  const monto = parseFloat(montoInicial) || 0;
  const hasDifference = lastFinalBalance !== null && monto !== lastFinalBalance;
  const difference = lastFinalBalance !== null ? monto - lastFinalBalance : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turno || !montoInicial || !profile?.nombre) return;
    onOpen(turno, profile.nombre, monto);
  };

  return (
    <div className="max-w-lg mx-auto">
      {lastClosedShift && (
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border mb-6">
          <h3 className="text-lg font-display tracking-wider text-muted-foreground mb-3">ÚLTIMO TURNO</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Responsable:</span>
              <p className="font-semibold">{lastClosedShift.responsable}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Turno:</span>
              <p className="font-semibold">{lastClosedShift.turno}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-semibold">{lastClosedShift.fecha}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cierre:</span>
              <p className="font-semibold">{lastClosedShift.horaCierre}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Saldo final:</span>
              <p className="text-xl font-display text-primary">Bs {lastFinalBalance?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <DoorOpen className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-display tracking-wider text-foreground">ABRIR CAJA</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Abriendo como <strong>{profile?.nombre || "..."}</strong>
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Turno</label>
          <Select value={turno} onValueChange={(v) => setTurno(v as Turno)}>
            <SelectTrigger><SelectValue placeholder="Selecciona turno" /></SelectTrigger>
            <SelectContent>
              {TURNOS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Monto inicial en caja (Bs)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            required
            className="text-lg"
          />
        </div>

        {lastFinalBalance !== null && montoInicial && (
          <div
            className={`rounded-lg p-3 flex items-start gap-3 text-sm ${
              hasDifference
                ? "bg-destructive/10 text-destructive"
                : "bg-success/10 text-success"
            }`}
          >
            {hasDifference ? (
              <>
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Diferencia detectada</p>
                  <p>
                    El turno anterior cerró con Bs {lastFinalBalance.toFixed(2)}.
                    Hay una diferencia de{" "}
                    <strong>Bs {difference > 0 ? "+" : ""}{difference.toFixed(2)}</strong>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Monto correcto</p>
                  <p>Coincide con el cierre del turno anterior.</p>
                </div>
              </>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full gap-2 text-base py-5"
          disabled={!turno || !montoInicial}
        >
          <DoorOpen className="w-5 h-5" /> Abrir Caja
        </Button>
      </form>
    </div>
  );
}
