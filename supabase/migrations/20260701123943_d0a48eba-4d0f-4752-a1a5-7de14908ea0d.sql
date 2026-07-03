
-- Ajouter le prix plancher côté marchand
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS min_price_mad numeric(10,2);

UPDATE public.products
  SET min_price_mad = ROUND(price_mad * 0.70, 2)
  WHERE min_price_mad IS NULL;

ALTER TABLE public.products
  ALTER COLUMN min_price_mad SET NOT NULL;

-- Table des négociations
CREATE TABLE public.negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','declined','closed')),
  agreed_price_mad numeric(10,2),
  last_offer_mad numeric(10,2),
  round_count int NOT NULL DEFAULT 0,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  locale text NOT NULL DEFAULT 'fr',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.negotiations TO authenticated;
GRANT ALL ON public.negotiations TO service_role;

ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own negotiations"
  ON public.negotiations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own negotiations"
  ON public.negotiations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own negotiations"
  ON public.negotiations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all negotiations"
  ON public.negotiations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER negotiations_touch_updated_at
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_negotiations_user ON public.negotiations(user_id, updated_at DESC);
