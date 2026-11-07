ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text GENERATED ALWAYS AS (CASE WHEN stock <= (avg_daily * lead_days) + 5 THEN 'Reorder Needed' ELSE 'In Stock' END) STORED;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS suggested_order_qty integer GENERATED ALWAYS AS (CEIL(avg_daily * 15)::integer) STORED;
COMMENT ON COLUMN public.products.mrp IS 'Selling price';