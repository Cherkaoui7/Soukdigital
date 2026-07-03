CREATE TABLE public.artisans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  region text,
  craft_fr text NOT NULL,
  craft_ar text NOT NULL,
  craft_en text NOT NULL,
  bio_fr text,
  bio_ar text,
  bio_en text,
  portrait_url text,
  years_experience integer,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.artisans TO anon, authenticated;
GRANT ALL ON public.artisans TO service_role;

ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans public read" ON public.artisans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage artisans" ON public.artisans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER artisans_touch_updated_at BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.products ADD COLUMN artisan_id uuid REFERENCES public.artisans(id) ON DELETE SET NULL;
CREATE INDEX products_artisan_idx ON public.products(artisan_id);

-- Seed artisans (Moroccan cities & crafts)
INSERT INTO public.artisans (slug, name, city, region, craft_fr, craft_ar, craft_en, bio_fr, bio_ar, bio_en, years_experience, featured) VALUES
('maalem-brahim-fes', 'Maâlem Brahim El Fassi', 'Fès', 'Fès-Meknès',
 'Maître dinandier & cuivre gravé', 'معلم النحاس المنقوش', 'Master coppersmith & engraver',
 'Dans la médina de Fès depuis quatre générations, Maâlem Brahim martèle et cisèle le cuivre selon les motifs hérités des Mérinides.',
 'ف قلب مدينة فاس، من أربعة أجيال، المعلم براهيم كيصنع النحاس على الطريقة المرينية.',
 'In the Fès medina for four generations, Maâlem Brahim hammers and chisels copper in the Merinid tradition.',
 32, true),
('lalla-fatima-marrakech', 'Lalla Fatima Zahra', 'Marrakech', 'Marrakech-Safi',
 'Tisseuse de tapis Beni Ouarain', 'نساجة زربية بني ورين', 'Beni Ouarain rug weaver',
 'Originaire du Moyen Atlas, Lalla Fatima installe son métier à tisser à Marrakech et perpétue les motifs berbères de sa tribu.',
 'من الأطلس المتوسط، لالة فاطمة كتنسج الزرابي البربرية ديال قبيلتها ف مراكش.',
 'From the Middle Atlas, Lalla Fatima keeps her tribe''s Berber weaving alive from her Marrakech workshop.',
 28, true),
('cooperative-taliouine', 'Coopérative Safran de Taliouine', 'Taliouine', 'Souss-Massa',
 'Cultivateurs de safran', 'تعاونية الزعفران', 'Saffron growers cooperative',
 'Coopérative de 40 familles cultivant le safran AOP de Taliouine à 1 500 m d''altitude, récolté à la main à l''aube.',
 'تعاونية ديال 40 عائلة كيزرعو الزعفران ديال تاليوين على علو 1500 متر، مجموع باليد ف الصباح.',
 '40 families growing PDO Taliouine saffron at 1,500 m, harvested by hand at dawn.',
 15, true),
('atelier-chefchaouen', 'Atelier Bleu de Chefchaouen', 'Chefchaouen', 'Tanger-Tétouan-Al Hoceïma',
 'Céramistes & potiers', 'الخزافة الزرقاء', 'Blue ceramicists & potters',
 'Petit atelier familial de la ville bleue, spécialisé dans la faïence émaillée aux pigments naturels de la région du Rif.',
 'ورشة عائلية ف المدينة الزرقاء، متخصصة ف الخزف المطلي بالأصباغ الطبيعية ديال الريف.',
 'A family workshop in the Blue City, specialising in glazed earthenware made with natural Rif pigments.',
 20, false),
('maalem-said-essaouira', 'Maâlem Saïd Gnaoua', 'Essaouira', 'Marrakech-Safi',
 'Sculpteur sur bois de thuya', 'نحات على خشب العرعار', 'Thuya wood carver',
 'Sur le port d''Essaouira, Maâlem Saïd sculpte le thuya endémique en boîtes marquetées et instruments gnaoua.',
 'ف ميناء الصويرة، المعلم سعيد كينحت خشب العرعار.',
 'On Essaouira''s harbour, Maâlem Saïd carves endemic thuya into marquetry boxes and Gnaoua instruments.',
 25, false),
('atelier-sale', 'Atelier Broderie de Salé', 'Salé', 'Rabat-Salé-Kénitra',
 'Brodeuses de caftans', 'مطرزات القفطان', 'Caftan embroiderers',
 'Trois sœurs brodent au fil d''or (sfifa, âakad) sur les caftans de mariage dans la médina de Salé.',
 'ثلاث خوتات كيطرزو بالسفيفة والعقاد على قفاطن العرس ف مدينة سلا.',
 'Three sisters embroider gold thread (sfifa, âakad) on wedding caftans in the Salé medina.',
 18, false);