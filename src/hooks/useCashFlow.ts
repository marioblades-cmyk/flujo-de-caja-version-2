import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Shift, Transaction, Turno, TipoMovimiento } from "@/types/cash";

export function useCashFlow() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  // Load shifts from DB on mount
  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      // Load closed shifts
      const { data: shiftRows, error: shiftErr } = await supabase
        .from("shifts")
        .select("*")
        .eq("cerrado", true)
        .order("created_at", { ascending: true });

      if (shiftErr) console.error("Error loading shifts:", shiftErr);

      // Load open shift (if any)
      const { data: openRows, error: openErr } = await supabase
        .from("shifts")
        .select("*")
        .eq("cerrado", false)
        .limit(1);

      if (openErr) console.error("Error loading open shift:", openErr);

      const closedShifts: Shift[] = [];
      for (const row of shiftRows || []) {
        const { data: txRows } = await supabase
          .from("transactions")
          .select("*")
          .eq("shift_id", row.id)
          .order("created_at", { ascending: true });

        closedShifts.push(rowToShift(row, txRows || []));
      }
      setShifts(closedShifts);

      if (openRows && openRows.length > 0) {
        const row = openRows[0];
        const { data: txRows } = await supabase
          .from("transactions")
          .select("*")
          .eq("shift_id", row.id)
          .order("created_at", { ascending: true });

        setCurrentShift(rowToShift(row, txRows || []));
      } else {
        setCurrentShift(null);
      }
    } catch (err) {
      console.error("Unexpected error in loadShifts:", err);
    } finally {
      setLoading(false);
    }
  };

  const rowToShift = (row: any, txRows: any[]): Shift => ({
    id: row.id,
    fecha: row.fecha,
    turno: row.turno as Turno,
    responsable: row.responsable,
    montoInicial: Number(row.monto_inicial),
    montoFinalAnterior: row.monto_final_anterior != null ? Number(row.monto_final_anterior) : null,
    transactions: txRows.map((tx) => ({
      id: tx.id,
      concepto: tx.concepto,
      tipo: tx.tipo as TipoMovimiento,
      monto: Number(tx.monto),
      hora: tx.hora,
    })),
    cerrado: row.cerrado,
    horaApertura: row.hora_apertura,
    horaCierre: row.hora_cierre,
  });

  const lastClosedShift = shifts.length > 0 ? shifts[shifts.length - 1] : null;

  const getShiftFinalBalance = (shift: Shift) => {
    let saldo = shift.montoInicial;
    for (const t of shift.transactions) {
      saldo += t.tipo === "INGRESO" ? t.monto : -t.monto;
    }
    return saldo;
  };

  const openCash = useCallback(
    async (turno: Turno, responsable: string, montoInicial: number) => {
      const montoFinalAnterior = lastClosedShift
        ? getShiftFinalBalance(lastClosedShift)
        : null;

      const horaApertura = new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
      const fecha = new Date().toISOString().slice(0, 10);

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("shifts")
        .insert({
          fecha,
          turno,
          responsable,
          monto_inicial: montoInicial,
          monto_final_anterior: montoFinalAnterior,
          cerrado: false,
          hora_apertura: horaApertura,
          user_id: user?.id,
        })
        .select()
        .single();

      if (data && !error) {
        setCurrentShift(rowToShift(data, []));
      }
    },
    [lastClosedShift]
  );

  const addTransaction = useCallback(
    async (concepto: string, tipo: TipoMovimiento, monto: number) => {
      if (!currentShift) return;
      const hora = new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          shift_id: currentShift.id,
          concepto,
          tipo,
          monto,
          hora,
        })
        .select()
        .single();

      if (data && !error) {
        const tx: Transaction = {
          id: data.id,
          concepto: data.concepto,
          tipo: data.tipo as TipoMovimiento,
          monto: Number(data.monto),
          hora: data.hora,
        };
        setCurrentShift((prev) =>
          prev ? { ...prev, transactions: [...prev.transactions, tx] } : null
        );
      }
    },
    [currentShift]
  );

  const closeCash = useCallback(async () => {
    if (!currentShift) return;
    const horaCierre = new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

    const { error } = await supabase
      .from("shifts")
      .update({ cerrado: true, hora_cierre: horaCierre })
      .eq("id", currentShift.id);

    if (!error) {
      const closed: Shift = { ...currentShift, cerrado: true, horaCierre };
      setShifts((prev) => [...prev, closed]);
      setCurrentShift(null);
    }
  }, [currentShift]);

  const reopenShift = useCallback(
    async (shiftId: string) => {
      // Check no open shift exists
      if (currentShift) return false;

      const { error } = await supabase
        .from("shifts")
        .update({ cerrado: false, hora_cierre: null })
        .eq("id", shiftId);

      if (!error) {
        await loadShifts();
        return true;
      }
      return false;
    },
    [currentShift]
  );

  const updateTransaction = useCallback(
    async (txId: string, data: { concepto?: string; tipo?: TipoMovimiento; monto?: number }) => {
      const { error } = await supabase
        .from("transactions")
        .update(data)
        .eq("id", txId);

      if (!error) {
        await loadShifts();
      }
      return !error;
    },
    []
  );

  const deleteTransaction = useCallback(
    async (txId: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", txId);

      if (!error) {
        await loadShifts();
      }
      return !error;
    },
    []
  );

  const deleteShift = useCallback(
    async (shiftId: string) => {
      await supabase.from("transactions").delete().eq("shift_id", shiftId);
      const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
      if (!error) {
        await loadShifts();
      }
      return !error;
    },
    []
  );

  const updateShift = useCallback(
    async (shiftId: string, data: { turno?: string; responsable?: string; monto_inicial?: number; hora_apertura?: string; hora_cierre?: string | null }) => {
      const { error } = await supabase
        .from("shifts")
        .update(data)
        .eq("id", shiftId);

      if (!error) {
        await loadShifts();
      }
      return !error;
    },
    []
  );

  const currentBalance = currentShift ? getShiftFinalBalance(currentShift) : null;

  return {
    currentShift,
    shifts,
    lastClosedShift,
    currentBalance,
    openCash,
    addTransaction,
    closeCash,
    reopenShift,
    updateTransaction,
    deleteTransaction,
    deleteShift,
    updateShift,
    getShiftFinalBalance,
    loading,
  };
}
