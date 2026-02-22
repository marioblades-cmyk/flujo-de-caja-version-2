export const TURNOS = ["MAÑANA", "TARDE", "DÍA"] as const;
export type Turno = (typeof TURNOS)[number];

export const RESPONSABLES = ["MARIO", "MARITO", "ALITO", "MAURI"] as const;
export type Responsable = (typeof RESPONSABLES)[number];

export type TipoMovimiento = "INGRESO" | "EGRESO";

export interface Transaction {
  id: string;
  concepto: string;
  tipo: TipoMovimiento;
  monto: number;
  hora: string;
}

export interface Shift {
  id: string;
  fecha: string;
  turno: Turno;
  responsable: Responsable;
  montoInicial: number;
  montoFinalAnterior: number | null;
  transactions: Transaction[];
  cerrado: boolean;
  horaApertura: string;
  horaCierre: string | null;
}

export type AppState = "CERRADA" | "ABIERTA";
