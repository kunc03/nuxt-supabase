-- Fungsi RPC untuk mendapatkan statistik ringkasan Dashboard Admin
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Berjalan dengan hak istimewa untuk bypass RLS jika diperlukan pembacaan agregat
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_products', COUNT(*),
    'total_stock_value', COALESCE(SUM(price * stock), 0),
    'out_of_stock', COUNT(*) FILTER (WHERE stock = 0),
    'avg_rating', COALESCE(ROUND(AVG(rate)::numeric, 1), 0)
  ) INTO result
  FROM public.products;

  RETURN result;
END;
$$;
