
-- ==== Enums ====
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cod', 'card', 'transfer', 'cash_plus');

-- ==== Profiles ====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ==== User roles ====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==== Profile auto-create trigger ====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==== Categories ====
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==== Products ====
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  description_en TEXT,
  price_mad NUMERIC(10,2) NOT NULL CHECK (price_mad >= 0),
  old_price_mad NUMERIC(10,2),
  image_url TEXT,
  origin_city TEXT,
  artisan_name TEXT,
  stock INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_featured_idx ON public.products(featured);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==== Orders ====
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL DEFAULT 'cod',
  total_mad NUMERIC(10,2) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ==== Order items ====
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price_mad NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  image_url TEXT
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins view all order items" ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==== Seed categories ====
INSERT INTO public.categories (slug, name_fr, name_ar, name_en, icon, sort) VALUES
  ('artisanat',   'Artisanat',   'الصناعة التقليدية', 'Craft',       'palette',    1),
  ('mode',        'Mode',        'الأزياء',           'Fashion',     'shirt',      2),
  ('gastronomie', 'Gastronomie', 'المطبخ',            'Gastronomy',  'utensils',   3),
  ('deco',        'Décoration',  'الديكور',           'Home Decor',  'lamp',       4),
  ('beaute',      'Beauté',      'الجمال',            'Beauty',      'sparkles',   5),
  ('bijoux',      'Bijoux',      'المجوهرات',         'Jewelry',     'gem',        6);

-- ==== Seed products ====
INSERT INTO public.products (slug, category_id, name_fr, name_ar, name_en, description_fr, description_ar, description_en, price_mad, old_price_mad, image_url, origin_city, artisan_name, stock, featured) VALUES
  ('caftan-fassi-brode', (SELECT id FROM public.categories WHERE slug='mode'),
    'Caftan Fassi brodé', 'قفطان فاسي مطرز', 'Embroidered Fassi Caftan',
    'Caftan traditionnel de Fès brodé main sur soie, coupe moderne.',
    'قفطان تقليدي من فاس مطرز باليد على الحرير، بقصة عصرية.',
    'Traditional Fes caftan hand-embroidered on silk, modern cut.',
    1890, 2400, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', 'Fès', 'Atelier Lalla Zohra', 12, true),

  ('babouche-cuir-safran', (SELECT id FROM public.categories WHERE slug='mode'),
    'Babouches cuir safran', 'بلغة جلدية زعفرانية', 'Saffron leather babouche',
    'Babouches en cuir tanné à Marrakech, teinture naturelle safran.',
    'بلغة جلدية مدبوغة في مراكش بصباغة الزعفران الطبيعية.',
    'Marrakech-tanned leather slippers, natural saffron dye.',
    290, NULL, 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800', 'Marrakech', 'Coopérative Tannerie Bab Debbagh', 40, true),

  ('theiere-argent-fes', (SELECT id FROM public.categories WHERE slug='artisanat'),
    'Théière argentée de Fès', 'براد فضي فاسي', 'Silver-plated Fes teapot',
    'Théière ciselée à la main par les maîtres dinandiers de Fès.',
    'براد شاي منقوش يدوياً على يد صناع النحاس بفاس.',
    'Hand-chased teapot by Fes coppersmith masters.',
    650, 780, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', 'Fès', 'Maalem Hassan', 20, true),

  ('tapis-beni-ouarain', (SELECT id FROM public.categories WHERE slug='deco'),
    'Tapis Beni Ouarain 2x3m', 'زربية بني ورين 2×3م', 'Beni Ouarain rug 2x3m',
    'Tapis berbère authentique tissé par les femmes du Moyen Atlas.',
    'زربية أمازيغية أصلية منسوجة من طرف نساء الأطلس المتوسط.',
    'Authentic Berber rug woven by women of the Middle Atlas.',
    3200, NULL, 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800', 'Azilal', 'Coopérative Tichka', 6, true),

  ('safran-taliouine-1g', (SELECT id FROM public.categories WHERE slug='gastronomie'),
    'Safran de Taliouine 1g', 'زعفران تاليوين 1غ', 'Taliouine saffron 1g',
    'Safran AOC de Taliouine, récolte 2025, catégorie 1.',
    'زعفران تاليوين ذو تسمية الأصل المحمية، حصاد 2025.',
    'Taliouine AOC saffron, 2025 harvest, category 1.',
    75, NULL, 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800', 'Taliouine', 'Coopérative Souktana', 100, false),

  ('huile-argan-bio-250ml', (SELECT id FROM public.categories WHERE slug='beaute'),
    'Huile d''argan bio 250ml', 'زيت أركان عضوي 250مل', 'Organic argan oil 250ml',
    'Pressée à froid par la coopérative féminine Tighanimine.',
    'معصور على البارد من طرف تعاونية النساء تغانيمين.',
    'Cold-pressed by the Tighanimine women cooperative.',
    180, 220, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', 'Essaouira', 'Coopérative Tighanimine', 55, true),

  ('amlou-argan-miel', (SELECT id FROM public.categories WHERE slug='gastronomie'),
    'Amlou argan-miel 250g', 'أملو أركان بالعسل 250غ', 'Argan-honey amlou 250g',
    'Amandes grillées, huile d''argan alimentaire et miel du Souss.',
    'لوز محمص وزيت أركان الأكل وعسل سوسي.',
    'Roasted almonds, food argan oil and Souss honey.',
    95, NULL, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 'Agadir', 'Coopérative Toudarte', 80, false),

  ('lanterne-fanous-cuivre', (SELECT id FROM public.categories WHERE slug='deco'),
    'Lanterne Fanous cuivre', 'فانوس نحاسي', 'Copper Fanous lantern',
    'Fanous ciselé main, éclairage tamisé aux motifs moucharabieh.',
    'فانوس منقوش يدوياً بإضاءة ناعمة وزخارف مشربية.',
    'Hand-chased fanous, soft light through moucharabieh patterns.',
    420, NULL, 'https://images.unsplash.com/photo-1602301413066-c46a1d5b18d6?w=800', 'Marrakech', 'Souk Haddadine', 25, true),

  ('djellaba-lin-homme', (SELECT id FROM public.categories WHERE slug='mode'),
    'Djellaba lin homme', 'جلابة كتان رجالية', 'Men''s linen djellaba',
    'Djellaba en lin naturel, coupe droite, capuche traditionnelle.',
    'جلابة كتان طبيعي بقصة مستقيمة وقلنسوة تقليدية.',
    'Natural linen djellaba, straight cut, traditional hood.',
    550, 690, 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800', 'Chefchaouen', 'Atelier Boussalham', 18, false),

  ('pouf-cuir-marrakech', (SELECT id FROM public.categories WHERE slug='deco'),
    'Pouf en cuir de Marrakech', 'بوف جلدي مراكشي', 'Marrakech leather pouf',
    'Pouf en cuir cousu main, garnissage inclus, coloris naturel.',
    'بوف جلدي مخيط يدوياً مع الحشو، لون طبيعي.',
    'Hand-stitched leather pouf, stuffing included, natural color.',
    780, NULL, 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800', 'Marrakech', 'Tannerie Chouara', 14, false),

  ('collier-berbere-argent', (SELECT id FROM public.categories WHERE slug='bijoux'),
    'Collier berbère argent', 'قلادة أمازيغية فضية', 'Berber silver necklace',
    'Collier fibule berbère en argent 925, pièce unique du Souss.',
    'قلادة أمازيغية بالفضة 925، قطعة فريدة من سوس.',
    '925 silver Berber fibula necklace, one-of-a-kind from Souss.',
    1450, NULL, 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800', 'Tiznit', 'Bijoutier Ait Baha', 8, true),

  ('zellige-plateau-mosaique', (SELECT id FROM public.categories WHERE slug='artisanat'),
    'Plateau mosaïque zellige', 'صينية موزاييك زليج', 'Zellige mosaic tray',
    'Plateau en bois habillé de zellige de Fès, motif géométrique.',
    'صينية خشبية مغطاة بزليج فاس بزخرفة هندسية.',
    'Wooden tray dressed with Fes zellige, geometric pattern.',
    340, 420, 'https://images.unsplash.com/photo-1612870988048-c6a4b6b8e5ff?w=800', 'Fès', 'Maalem Zellige', 22, false);
