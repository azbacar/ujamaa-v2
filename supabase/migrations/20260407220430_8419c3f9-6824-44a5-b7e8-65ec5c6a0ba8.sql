-- Taxi fares table
CREATE TABLE public.taxi_fares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location text NOT NULL,
  to_location text NOT NULL,
  island text NOT NULL DEFAULT 'Grande Comore',
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'FC',
  vehicle_type text NOT NULL DEFAULT 'taxi',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.taxi_fares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active taxi fares" ON public.taxi_fares
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins manage taxi fares" ON public.taxi_fares
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Pharmacy guards table
CREATE TABLE public.pharmacy_guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  island text NOT NULL DEFAULT 'Grande Comore',
  city text,
  is_on_duty boolean NOT NULL DEFAULT false,
  duty_start timestamptz,
  duty_end timestamptz,
  latitude numeric,
  longitude numeric,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.pharmacy_guards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pharmacies" ON public.pharmacy_guards
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins manage pharmacies" ON public.pharmacy_guards
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));