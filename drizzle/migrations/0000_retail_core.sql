CREATE TYPE public.app_role AS ENUM ('owner', 'supervisor', 'cashier');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own or owner reads profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "own or owner reads roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner inserts roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner updates roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') AND user_id <> auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner deletes roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') AND user_id <> auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, branch, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE(NEW.email, ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') THEN 'cashier'::public.app_role ELSE 'owner'::public.app_role END);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.vendors (
  id text PRIMARY KEY, name text NOT NULL, gstin text NOT NULL DEFAULT '', city text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '', state text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read vendors" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner inserts vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner updates vendors" ON public.vendors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner deletes vendors" ON public.vendors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.products (
  sku text PRIMARY KEY, name text NOT NULL, brand text NOT NULL DEFAULT '', hsn text NOT NULL DEFAULT '',
  gst numeric NOT NULL DEFAULT 0, cost numeric NOT NULL DEFAULT 0, mrp numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0, avg_daily numeric NOT NULL DEFAULT 0, vendor_id text REFERENCES public.vendors(id),
  lead_days integer NOT NULL DEFAULT 1, buffer integer NOT NULL DEFAULT 0, last_scan_days integer NOT NULL DEFAULT 0,
  rack text NOT NULL DEFAULT '', batch text NOT NULL DEFAULT '', expiry_days integer NOT NULL DEFAULT 365,
  category text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner/supervisor update products" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'supervisor'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "owner inserts products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner deletes products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_no text NOT NULL,
  user_id uuid NOT NULL,
  lines jsonb NOT NULL,
  revenue numeric NOT NULL,
  profit numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads all sales, others own" ON public.sales FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.complete_sale(_lines jsonb)
RETURNS public.sales LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l jsonb; p public.products; q int; out_lines jsonb := '[]'; rev numeric := 0; prof numeric := 0; s public.sales;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF jsonb_array_length(_lines) = 0 THEN RAISE EXCEPTION 'Empty cart'; END IF;
  FOR l IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    q := (l->>'qty')::int;
    SELECT * INTO p FROM public.products WHERE sku = l->>'sku' FOR UPDATE;
    IF p.sku IS NULL THEN RAISE EXCEPTION 'Unknown product %', l->>'sku'; END IF;
    IF q <= 0 OR q > p.stock THEN RAISE EXCEPTION 'Not enough stock for %', p.name; END IF;
    UPDATE public.products SET stock = stock - q, last_scan_days = 0, updated_at = now() WHERE sku = p.sku;
    rev := rev + p.mrp * q; prof := prof + (p.mrp - p.cost) * q;
    out_lines := out_lines || jsonb_build_object('sku', p.sku, 'name', p.name, 'qty', q, 'price', p.mrp, 'cost', p.cost);
  END LOOP;
  INSERT INTO public.sales (sale_no, user_id, lines, revenue, profit)
  VALUES ('INV-' || to_char(now(), 'YYMMDD-HH24MISS'), auth.uid(), out_lines, rev, prof) RETURNING * INTO s;
  RETURN s;
END $$;
REVOKE EXECUTE ON FUNCTION public.complete_sale(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_sale(jsonb) TO authenticated;

CREATE TABLE public.inward_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE,
  vendor_id text REFERENCES public.vendors(id),
  file_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  lines jsonb NOT NULL DEFAULT '[]',
  taxable numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  created_by uuid,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.inward_invoices TO authenticated;
GRANT ALL ON public.inward_invoices TO service_role;
ALTER TABLE public.inward_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read invoices" ON public.inward_invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY "staff add invoices" ON public.inward_invoices FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "staff update invoices" ON public.inward_invoices FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

INSERT INTO public.vendors (id,name,gstin,city,phone,state) VALUES
('V01','HUL North Distribution','07AAACH1004N1Z3','New Delhi','+91 98110 22341','Delhi'),
('V02','Adani Wilmar Hub','24AABCA8056G1ZK','Ahmedabad','+91 98250 77104','Gujarat'),
('V03','Gujarat Co-operative Milk Marketing Federation','24AAAAG5588Q1ZJ','Anand','+91 99090 11420','Gujarat'),
('V04','Nestlé India Distributors','07AAACN0255D1ZB','Gurugram','+91 98731 55290','Haryana'),
('V05','ITC Foods Channel Partner','19AAACI5950L1Z7','Kolkata','+91 98300 44812','West Bengal'),
('V06','Tata Consumer Products Depot','27AAACT3518Q1ZW','Mumbai','+91 98201 66310','Maharashtra');
INSERT INTO public.products (sku,name,brand,hsn,gst,cost,mrp,stock,avg_daily,vendor_id,lead_days,buffer,last_scan_days,rack,batch,expiry_days,category) VALUES
('FOR-SUN-1L','Fortune Sunlite Sunflower Oil 1L','Fortune','1512',5,132,165,46,18,'V02',3,20,0,'A1','FS2409K',182,'Edible Oil'),
('AMU-BUT-500','Amul Butter 500g','Amul','0405',12,248,285,22,9,'V03',2,8,0,'C2','AB1188',21,'Dairy'),
('MAG-NDL-280','Maggi 2-Minute Noodles 280g','Maggi','1902',12,48,56,310,34,'V04',4,40,0,'B3','MG55T2',96,'Packaged Food'),
('TAT-SLT-1KG','Tata Salt 1kg','Tata','2501',0,23,28,58,26,'V06',3,30,0,'B1','TS0921',540,'Staples'),
('ASH-ATA-5KG','Aashirvaad Shudh Chakki Atta 5kg','Aashirvaad','1101',5,238,289,34,14,'V05',5,15,0,'A3','AA7712',64,'Staples'),
('DET-HW-RF','Dettol Original Liquid Handwash Refill 750ml','Dettol','3401',18,99,129,140,2,'V01',4,10,52,'D2','DT3390',420,'Home Care'),
('AMU-TAZ-1L','Amul Taaza Toned Milk 1L','Amul','0401',0,62,68,72,40,'V03',1,30,0,'C1','A29',4,'Dairy'),
('BRI-BRD-400','Britannia Whole Wheat Bread 400g','Britannia','1905',0,38,50,25,22,'V05',1,10,0,'C3','BB0411',3,'Bakery'),
('SUR-XL-1KG','Surf Excel Easy Wash 1kg','HUL','3402',18,112,140,88,1,'V01',4,10,67,'D1','SE8820',610,'Home Care'),
('KIS-KET-1KG','Kissan Fresh Tomato Ketchup 950g','Kissan','2103',12,118,150,64,0,'V01',4,8,94,'B4','KK1201',28,'Packaged Food'),
('FOR-BAS-5KG','Fortune Everyday Basmati Rice 5kg','Fortune','1006',5,420,545,52,0,'V02',3,6,61,'A2','FB4410',300,'Staples'),
('NES-KKT-4F','Nestlé KitKat 4 Finger (Pack of 12)','Nestlé','1806',18,210,264,18,6,'V04',4,6,0,'E1','KK90X',12,'Confectionery'),
('HUL-LUX-4','Lux Soft Touch Soap 4x100g','HUL','3401',18,128,165,41,0,'V01',4,6,38,'D3','LX5512',700,'Personal Care'),
('ITC-BIN-200','Bingo Mad Angles 130g','ITC','2106',12,16,20,240,0,'V05',5,20,47,'E2','BG2207',45,'Snacks');
INSERT INTO public.inward_invoices (invoice_no, vendor_id, file_name, status, lines) VALUES
('HUL/24/88213','V01','HUL_challan_88213.pdf','pending','[{"sku":"SUR-XL-1KG","name":"Surf Excel Easy Wash 1kg","hsn":"3402","billed":48,"po":48,"verified":43,"rate":112,"gst":18,"batch":"SE8820","mfg":"2026-08-12","exp":"2028-08-11"},{"sku":"DET-HW-RF","name":"Dettol Original Liquid Handwash Refill 750ml","hsn":"3401","billed":36,"po":36,"verified":36,"rate":99,"gst":18,"batch":"DT3390","mfg":"2026-07-02","exp":"2027-12-31"},{"sku":"HUL-LUX-4","name":"Lux Soft Touch Soap 4x100g","hsn":"3401","billed":24,"po":30,"verified":24,"rate":128,"gst":18,"batch":"LX5512","mfg":"2026-09-20","exp":"2028-09-19"},{"sku":"KIS-KET-1KG","name":"Kissan Fresh Tomato Ketchup 950g","hsn":"2103","billed":12,"po":12,"verified":12,"rate":118,"gst":12,"batch":"KK1201","mfg":"2026-06-01","exp":"2026-12-01"}]'),
('AWL/INV/55102','V02','AWL_55102.pdf','posted','[]');
