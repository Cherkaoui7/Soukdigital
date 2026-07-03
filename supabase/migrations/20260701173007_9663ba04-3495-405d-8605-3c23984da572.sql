
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, identifier, window_start)
);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies: service_role bypasses RLS, and no other role can read/write.

CREATE INDEX rate_limits_lookup_idx ON public.rate_limits (bucket, identifier, window_start DESC);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket text,
  _identifier text,
  _max_requests integer,
  _window_seconds integer
) RETURNS TABLE (allowed boolean, current_count integer, retry_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window_start timestamptz;
  _count integer;
BEGIN
  _window_start := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.rate_limits (bucket, identifier, window_start, count)
  VALUES (_bucket, _identifier, _window_start, 1)
  ON CONFLICT (bucket, identifier, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO _count;

  -- Cleanup old rows opportunistically
  DELETE FROM public.rate_limits
   WHERE bucket = _bucket
     AND window_start < now() - interval '1 hour';

  RETURN QUERY SELECT
    _count <= _max_requests,
    _count,
    GREATEST(0, _window_seconds - extract(epoch FROM (now() - _window_start))::integer);
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
