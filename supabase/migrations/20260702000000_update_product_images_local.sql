-- Update product image_url to local SVG assets (no external network dependency)

UPDATE public.products SET image_url = '/images/product-caftan.svg'    WHERE slug = 'caftan-fassi-brode';
UPDATE public.products SET image_url = '/images/product-babouche.svg'  WHERE slug = 'babouche-cuir-safran';
UPDATE public.products SET image_url = '/images/product-teapot.svg'    WHERE slug = 'theiere-argent-fes';
UPDATE public.products SET image_url = '/images/product-tapis.svg'     WHERE slug = 'tapis-beni-ouarain';
UPDATE public.products SET image_url = '/images/product-safran.svg'    WHERE slug = 'safran-taliouine-1g';
UPDATE public.products SET image_url = '/images/product-argan.svg'     WHERE slug = 'huile-argan-bio-250ml';
UPDATE public.products SET image_url = '/images/product-amlou.svg'     WHERE slug = 'amlou-argan-miel';
UPDATE public.products SET image_url = '/images/product-lanterne.svg'  WHERE slug = 'lanterne-fanous-cuivre';
UPDATE public.products SET image_url = '/images/product-djellaba.svg'  WHERE slug = 'djellaba-lin-homme';
UPDATE public.products SET image_url = '/images/product-pouf.svg'      WHERE slug = 'pouf-cuir-marrakech';
UPDATE public.products SET image_url = '/images/product-collier.svg'   WHERE slug = 'collier-berbere-argent';
UPDATE public.products SET image_url = '/images/product-zellige.svg'   WHERE slug = 'zellige-plateau-mosaique';
