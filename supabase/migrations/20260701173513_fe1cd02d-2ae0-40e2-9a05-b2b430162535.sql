
-- 1. Push subscriptions: drop overly permissive insert
DROP POLICY IF EXISTS "anyone can subscribe" ON public.push_subscriptions;

-- 2. Rate limits: explicit deny for anon/authenticated (service_role bypasses RLS)
CREATE POLICY "rate_limits_no_client_access"
ON public.rate_limits FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

-- 3. Reviews: public view without user_id
CREATE OR REPLACE VIEW public.public_product_reviews
WITH (security_invoker = true) AS
SELECT id, product_id, rating, title, body, created_at
FROM public.product_reviews
WHERE status = 'approved';

GRANT SELECT ON public.public_product_reviews TO anon, authenticated;

-- Drop the public exposure of user_id on the base table
DROP POLICY IF EXISTS "Approved reviews are public" ON public.product_reviews;
CREATE POLICY "Approved reviews are public"
ON public.product_reviews FOR SELECT TO authenticated
USING (status = 'approved');
