
-- Loyalty points on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

-- Loyalty transactions log
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own loyalty tx"
  ON public.loyalty_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all loyalty tx"
  ON public.loyalty_transactions FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS loyalty_tx_user_created_idx
  ON public.loyalty_transactions(user_id, created_at DESC);

-- Award 1 point per 10 MAD spent on new orders
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earned integer;
BEGIN
  earned := GREATEST(0, floor(COALESCE(NEW.total_mad, 0) / 10))::integer;
  IF earned > 0 THEN
    UPDATE public.profiles
      SET loyalty_points = loyalty_points + earned,
          updated_at = now()
      WHERE id = NEW.user_id;

    INSERT INTO public.loyalty_transactions(user_id, order_id, points, reason)
    VALUES (NEW.user_id, NEW.id, earned, 'order');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty_points ON public.orders;
CREATE TRIGGER trg_award_loyalty_points
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points();
