
-- Shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha TEXT NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('MAÑANA', 'TARDE', 'DÍA')),
  responsable TEXT NOT NULL CHECK (responsable IN ('MARIO', 'MARITO', 'ALITO', 'MAURI')),
  monto_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_final_anterior NUMERIC(12,2),
  cerrado BOOLEAN NOT NULL DEFAULT false,
  hora_apertura TEXT NOT NULL,
  hora_cierre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
  monto NUMERIC(12,2) NOT NULL,
  hora TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Public access policies (shared store app, no auth needed)
CREATE POLICY "Allow all access to shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_transactions_shift_id ON public.transactions(shift_id);
CREATE INDEX idx_shifts_created_at ON public.shifts(created_at DESC);
