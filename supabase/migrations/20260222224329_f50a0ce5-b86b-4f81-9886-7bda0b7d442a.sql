
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add user_id column to shifts
ALTER TABLE public.shifts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow all access to transactions" ON public.transactions;

-- New RLS policies for shifts - authenticated users can see all shifts, only create their own
CREATE POLICY "Authenticated users can view all shifts"
  ON public.shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own shifts"
  ON public.shifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own shifts"
  ON public.shifts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete own shifts"
  ON public.shifts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- New RLS policies for transactions
CREATE POLICY "Authenticated users can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (true);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
