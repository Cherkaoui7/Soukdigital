import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  RefreshCw,
  MapPin,
  Users,
  Package,
  Star,
  Play,
  X,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Instagram,
  Heart,
  HelpCircle,
  Clock,
  User,
  Tag,
  ShoppingBag,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/ProductSkeleton";
import { useI18n, localizedField, type Locale } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  component: HomePage,
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:image", content: "/og-souk-digital.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "Souk Digital — artisanat marocain authentique" },
      { name: "twitter:image", content: "/og-souk-digital.jpg" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

// Particles overlay for premium ambient look
const Particles = () => {
  const [particles, setParticles] = React.useState<Array<{id: number, left: string, top: string, delay: string, duration: string, size: string}>>([]);

  React.useEffect(() => {
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${12 + Math.random() * 8}s`,
      size: `${2 + Math.random() * 3}px`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute bg-white/10 rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `float-up ${p.duration} linear infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

// Stat Counter Component
const StatCounter = ({ value, label, subtitle }: { value: string; label: string; subtitle: string }) => {
  const numericValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const isDecimal = value.includes(".") && parseFloat(value) < 10;
  const suffix = value.replace(/[0-9.]/g, "");
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const duration = 1500;
    const totalSteps = duration / 16;
    const increment = numericValue / totalSteps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        clearInterval(timer);
        setCount(numericValue);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <div className="text-center px-4">
      <div className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
        {isDecimal ? (count / 10).toFixed(1) : count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-semibold text-white/95 mt-1">{label}</div>
      <div className="text-xs text-white/60 mt-0.5">{subtitle}</div>
    </div>
  );
};

function HomePage() {
  const { t, locale } = useI18n();
  const [activeCategoryTab, setActiveCategoryTab] = React.useState("all");

  // Hero slides setup
  const heroSlides = [
    {
      url: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=1000",
      title: "Fontaine Zellige à Fès",
    },
    {
      url: "https://images.unsplash.com/photo-1597212618440-806262de474b?auto=format&fit=crop&q=80&w=1000",
      title: "Riad à Marrakech",
    },
    {
      url: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&q=80&w=1000",
      title: "Ruelle Bleue de Chefchaouen",
    },
    {
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&q=80&w=1000",
      title: "Sahara dunes",
    },
    {
      url: "https://images.unsplash.com/photo-1564507592937-25994a9015b2?auto=format&fit=crop&q=80&w=1000",
      title: "Remparts d'Essaouira",
    },
    {
      url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1000",
      title: "Montagnes de l'Atlas",
    },
    {
      url: "https://images.unsplash.com/photo-1582234372722-50d7ccc30e5a?auto=format&fit=crop&q=80&w=1000",
      title: "Artisans du Cuivre à Fès",
    }
  ];

  const [currentHeroSlide, setCurrentHeroSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Categories query
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  // Immersive Photos mapping for Categories
  const categoryImages: Record<string, string> = {
    caftans: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=500&q=80",
    tapis: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=500&q=80",
    bijoux: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80",
    decoration: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80",
    deco: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80",
    "huile-dargan": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=500&q=80",
    babouches: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80",
  };

  const fallbackCategoryImage = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=500&q=80";

  // Featured query (Coups de cœur)
  const featuredQuery = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  // Filter products based on activeCategoryTab
  const filteredProducts = React.useMemo(() => {
    if (!featuredQuery.data) return [];
    if (activeCategoryTab === "all") return featuredQuery.data.slice(0, 8);
    
    // Simple filter by name or slug keywords
    return featuredQuery.data.filter(product => {
      const name = product.name_fr.toLowerCase();
      if (activeCategoryTab === "tapis") return name.includes("tapis") || name.includes("berbère") || name.includes("ouarain") || name.includes("azilal");
      if (activeCategoryTab === "caftans") return name.includes("caftan") || name.includes("robe");
      if (activeCategoryTab === "bijoux") return name.includes("bijou") || name.includes("collier") || name.includes("boucle");
      if (activeCategoryTab === "decoration") return name.includes("lanterne") || name.includes("bougeoir") || name.includes("zellige") || name.includes("poterie");
      if (activeCategoryTab === "babouches") return name.includes("babouche");
      if (activeCategoryTab === "cuisine") return name.includes("tajine") || name.includes("plat") || name.includes("bol") || name.includes("cuisine") || name.includes("verre");
      return true;
    }).slice(0, 8);
  }, [featuredQuery.data, activeCategoryTab]);

  // Complete 12 regions list
  const regions = [
    {
      id: "fes",
      name: "Fès-Meknès",
      title: "Fès",
      image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=400",
      artisans: 85,
      crafts: ["Zellige traditionnel", "Caftans brodés", "Cuir tanné végétal"],
      desc: "Capitale spirituelle et artisanale du Royaume, célèbre pour son quartier des tanneurs et l'extrême finesse de sa céramique émaillée.",
    },
    {
      id: "marrakech",
      name: "Marrakech-Safi",
      title: "Marrakech",
      image: "https://images.unsplash.com/photo-1597212618440-806262de474b?auto=format&fit=crop&q=80&w=400",
      artisans: 120,
      crafts: ["Lanternes ciselées", "Babouches en cuir", "Fer forgé"],
      desc: "La ville ocre bouillonne de créativité. Les dinandiers de la place Souk El Kimakh façonnent le laiton en luminaires magiques.",
    },
    {
      id: "chefchaouen",
      name: "Tanger-Tétouan-Al Hoceïma",
      title: "Chefchaouen",
      image: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&q=80&w=400",
      artisans: 45,
      crafts: ["Tissage en laine rhomboïdal", "Chapeaux traditionnels R'fya"],
      desc: "La perle bleue du Nord perpétue un tissage de laine rugueuse aux motifs berbères singuliers et des teintures éclatantes.",
    },
    {
      id: "essaouira",
      name: "Marrakech-Safi",
      title: "Essaouira",
      image: "https://images.unsplash.com/photo-1564507592937-25994a9015b2?auto=format&fit=crop&q=80&w=400",
      artisans: 35,
      crafts: ["Huile d'Argan pure", "Ebénisterie en Thuya", "Bijoux en argent"],
      desc: "Baignée par l'Atlantique, Essaouira est le berceau de l'or liquide (Argan) et des sculpteurs sur précieux bois de Thuya.",
    },
    {
      id: "tetouan",
      name: "Tanger-Tétouan-Al Hoceïma",
      title: "Tétouan",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400",
      artisans: 25,
      crafts: ["Broderie fine (Tarj)", "Céramique émaillée fine"],
      desc: "Héritière du savoir-faire andalou, Tétouan brille par sa broderie impériale et son art décoratif du bois peint (Zouak).",
    },
    {
      id: "safi",
      name: "Marrakech-Safi",
      title: "Safi",
      image: "https://images.unsplash.com/photo-1610940908711-2e69888cc8b9?auto=format&fit=crop&q=80&w=400",
      artisans: 50,
      crafts: ["Poterie vernissée", "Céramique de Safi"],
      desc: "Capitale de la céramique marocaine, Safi utilise une argile unique pour cuire des pièces colorées de renommée mondiale.",
    },
    {
      id: "ouarzazate",
      name: "Drâa-Tafilalet",
      title: "Ouarzazate",
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&q=80&w=400",
      artisans: 30,
      crafts: ["Tapis de Taznakht", "Dagues d'argent"],
      desc: "Porte du Sahara, la région excelle dans le tissage de tapis de Taznakht aux colorants naturels intenses (safran, henné).",
    },
    {
      id: "agadir",
      name: "Souss-Massa",
      title: "Agadir",
      image: "https://images.unsplash.com/photo-1551829141-8664b38271e1?auto=format&fit=crop&q=80&w=400",
      artisans: 40,
      crafts: ["Huile d'Argan bio", "Bijoux traditionnels en argent"],
      desc: "Berceau de l'arganier et des coopératives féminines, la région brille aussi par les parures d'argent de Tiznit.",
    },
    {
      id: "atlas",
      name: "Béni Mellal-Khénifra",
      title: "Atlas",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400",
      artisans: 75,
      crafts: ["Tapis berbère Azilal", "Tissage M'rirt en laine vierge"],
      desc: "Dans les hauteurs du Haut Atlas, les tisseuses expriment leur liberté artistique sur des tapis blancs parsemés de motifs colorés.",
    },
    {
      id: "dakhla",
      name: "Dakhla-Oued Ed-Dahab",
      title: "Dakhla",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&q=80&w=400",
      artisans: 15,
      crafts: ["Artisanat du désert", "Bijoux en coquillage & cuir"],
      desc: "Point de rencontre entre désert et océan, Dakhla cultive des pièces uniques faites de cuir saharien et de perles marines.",
    },
    {
      id: "rabat",
      name: "Rabat-Salé-Kénitra",
      title: "Rabat",
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=400",
      artisans: 60,
      crafts: ["Poterie fine de Salé", "Tapis urbain de Rabat"],
      desc: "Capitale impériale abritant des tissages raffinés aux motifs géométriques complexes d'influence turque.",
    },
    {
      id: "casablanca",
      name: "Casablanca-Settat",
      title: "Casablanca",
      image: "https://images.unsplash.com/photo-1541480601022-2308c0f02487?auto=format&fit=crop&q=80&w=400",
      artisans: 95,
      crafts: ["Maroquinerie moderne", "Couture haute couture"],
      desc: "La métropole moderne allie techniques contemporaines et motifs ancestraux pour un artisanat d'exception.",
    }
  ];

  // Artisans list
  const artisans = [
    {
      name: "Ahmed",
      title: "Maître dinandier",
      city: "Fès",
      exp: "35 ans",
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200",
      quote: "Chaque pièce est fabriquée à la main.",
    },
    {
      name: "Fatima",
      title: "Tisseuse de tapis",
      city: "Azilal",
      exp: "26 ans",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      quote: "Le tissage est notre héritage.",
    },
    {
      name: "Youssef",
      title: "Artisan du cuir",
      city: "Marrakech",
      exp: "20 ans",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      quote: "Le cuir naturel raconte une vie.",
    },
    {
      name: "Amina",
      title: "Artisane de zellige",
      city: "Fès",
      exp: "15 ans",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
      quote: "Le zellige est de la poésie pure.",
    }
  ];

  // Rug Configurator States
  const [rugColor, setRugColor] = React.useState("cream");
  const [rugPattern, setRugPattern] = React.useState("diamond");
  const [rugSize, setRugSize] = React.useState("1.5x2m");
  const [rugBorder, setRugBorder] = React.useState("none");
  const [rugText, setRugText] = React.useState("");

  const rugColorsMap: Record<string, { bg: string, border: string, dot: string }> = {
    cream: { bg: "#fbfaf8", border: "#e8dfd3", dot: "#d97706" },
    indigo: { bg: "#1e2436", border: "#2d354b", dot: "#a78bfa" },
    terracotta: { bg: "#ab4c36", border: "#8c3b28", dot: "#fef08a" },
    saffron: { bg: "#d97b29", border: "#ba661e", dot: "#fef3c7" },
    emerald: { bg: "#2a5944", border: "#1f4232", dot: "#f3f4f6" },
  };

  const calculatePrice = () => {
    let price = 2500;
    if (rugSize === "2x3m") price += 1700;
    if (rugSize === "3x4m") price += 3500;
    if (rugPattern === "zellige") price += 300;
    if (rugBorder === "simple") price += 150;
    if (rugBorder === "zellige") price += 250;
    return price;
  };

  const handleConfiguratorOrder = () => {
    alert(`Votre tapis personnalisé (${rugSize}, motif ${rugPattern}, couleur ${rugColor}, bordure ${rugBorder}, brodé au nom de "${rugText || "Aucun"}") a été configuré pour un total de ${calculatePrice()} MAD ! Redirection vers la commande...`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans antialiased text-[#1E293B]">
      <SiteHeader />

      {/* 1. HERO SECTION (Immersive sunset sky gradient) */}
      <section className="relative min-h-[95dvh] flex items-center overflow-hidden bg-gradient-to-br from-[#241C83] via-[#5137E8] to-[#F57A3D] pt-24 pb-16 text-white">
        <Particles />
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30L30 60L0 30Z\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'0.5\'/%3E%3C/svg%3E')]" />

        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:px-8 items-center lg:grid-cols-[1.1fr_1fr] relative z-10 w-full">
          {/* Left Text Column */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4.5 py-1.5 text-[0.8rem] font-bold uppercase tracking-wider text-amber-300 mb-6 shadow-sm max-w-max">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
              ✨ Artisanat Marocain Authentique
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[4.2rem] font-bold leading-[1.08] text-balance mb-6">
              Le savoir-faire ancestral <br />
              du Maroc, chez vous.
            </h1>

            <p className="max-w-[555px] text-[1.1rem] leading-[1.65] text-white/80 mb-8 font-normal">
              Chaque création raconte une histoire. Découvrez et soutenez directement les artisans des 12 régions du Royaume.
            </p>

            {/* Main Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Link to="/produits" className="inline-flex items-center justify-center rounded-full bg-[#FAF7F2] hover:bg-white px-9 py-4.5 text-base font-bold text-[#241C83] shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.97]">
                Découvrir les créations
              </Link>
              <a href="#explore-regions" className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/15 px-9 py-4.5 text-base font-semibold text-white transition-all duration-300 shadow-sm active:scale-[0.97]">
                Explorer les régions
                <MapPin className="h-4.5 w-4.5 text-amber-300" />
              </a>
            </div>

            {/* Trust Signals Row */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-white/85 text-[11px] font-bold tracking-wide uppercase">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-amber-300 shrink-0" />
                Livraison partout
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-amber-300 shrink-0" />
                Paiement sécurisé
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4.5 w-4.5 text-amber-300 shrink-0" fill="currentColor" />
                Authenticité certifiée
              </div>
            </div>
          </div>

          {/* Right Image Slider Column */}
          <div className="relative flex items-center justify-center min-h-[440px] md:min-h-[500px]">
            <div className="relative w-full max-w-[480px] aspect-[4/5] mx-auto">
              
              {/* Slider Image Container */}
              <div className="w-full h-full rounded-[2.5rem] border-[6px] border-white/20 overflow-hidden relative z-10 shadow-[0_30px_70px_rgba(0,0,0,0.3)] bg-slate-900/50">
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.url}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentHeroSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  >
                    <img
                      src={slide.url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Slider Dots */}
              <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentHeroSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === currentHeroSlide ? "w-6 bg-amber-400" : "w-2.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -right-6 z-20 bg-white/95 backdrop-blur-md border border-slate-100 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3.5 max-w-[280px]">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop"
                  alt="Ahmed"
                  className="rounded-full border-2 border-amber-500 h-11 w-11 shrink-0 object-cover"
                />
                <div className="leading-normal text-[#1E293B]">
                  <div className="flex text-amber-500 text-[10px] gap-0.5">★★★★★</div>
                  <p className="font-bold text-xs mt-0.5">Ahmed</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Maître dinandier, Fès</p>
                </div>
              </div>

              <div className="absolute bottom-8 -left-6 z-20 bg-white/95 backdrop-blur-md border border-slate-100 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 shadow-inner">🔥</div>
                <div className="leading-normal text-[#1E293B]">
                  <p className="font-bold text-sm leading-none">+1,200 ventes</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">ce mois-ci</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE REGIONS SECTION */}
      <section id="explore-regions" className="py-24 bg-[#FAF7F2] border-b border-slate-200/50 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold text-[#1E293B]">
              Explorez les 12 régions du Maroc
            </h2>
            <p className="text-slate-500 mt-3 text-sm">
              Chaque région possède un savoir-faire transmis de génération en génération.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {regions.map((region) => (
              <Dialog key={region.id}>
                <DialogTrigger asChild>
                  <button className="group text-left relative overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-[4/3] p-0 cursor-pointer shadow-sm hover:shadow-souk hover:border-primary/20 hover:-translate-y-1.5 transition-all duration-500">
                    <img
                      src={region.image}
                      alt={region.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />
                    
                    <div className="absolute bottom-4 left-4 right-4 z-20 text-white flex flex-col justify-end h-full">
                      <span className="text-[9px] font-bold tracking-widest text-amber-300 uppercase">
                        {region.name}
                      </span>
                      <h3 className="font-display text-2xl font-bold mt-0.5 leading-none">
                        {region.title}
                      </h3>
                      <p className="text-[10px] text-white/70 mt-1.5 font-medium">
                        +{region.artisans} artisans certifiés
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 mt-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Explorer la région</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md bg-white border-slate-200">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2 text-slate-900">
                      <MapPin className="h-5 w-5 text-secondary" />
                      Région {region.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <img
                      src={region.image}
                      alt={region.title}
                      className="w-full h-48 object-cover rounded-xl border border-slate-150"
                    />
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      {region.desc}
                    </p>
                    
                    <div className="mt-5 border-t border-slate-150 pt-4">
                      <h4 className="font-display text-sm font-bold text-slate-950">Savoir-faire emblématiques :</h4>
                      <ul className="mt-2.5 space-y-2">
                        {region.crafts.map((craft) => (
                          <li key={craft} className="flex items-center gap-2.5 text-xs text-slate-800 font-medium">
                            <span className="h-2 w-2 rounded-full bg-secondary shrink-0" />
                            {craft}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Link
                        to="/produits"
                        search={{ search: region.title }}
                        className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Voir les produits de la région
                      </Link>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* 3. ARTISANS SECTION */}
      <section id="artisans" className="py-24 bg-[#FAF7F2] border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
            
            {/* Left Side: Artisans list */}
            <div>
              <h2 className="font-display text-4xl font-bold text-[#1E293B]">
                Rencontrez les gardiens du patrimoine
              </h2>
              <p className="text-slate-500 mt-3 text-sm max-w-xl">
                Découvrez l'histoire, la passion et le parcours des hommes et des femmes derrière chaque pièce unique.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {artisans.map((artisan) => (
                  <div key={artisan.name} className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                    <img
                      src={artisan.image}
                      alt={artisan.name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-secondary/30 shrink-0"
                    />
                    <div className="leading-tight flex-1">
                      <h3 className="font-display text-base font-bold text-slate-900">
                        👳 {artisan.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {artisan.title} • {artisan.city}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        {artisan.exp} d'expérience
                      </p>
                      <div className="flex text-amber-500 text-[10px] gap-0.5 mt-1.5">
                        ★★★★★
                      </div>
                      <p className="text-xs italic text-slate-600 mt-2">
                        "{artisan.quote}"
                      </p>
                      <Link
                        to="/produits"
                        search={{ search: artisan.name }}
                        className="mt-3.5 inline-flex items-center gap-1 text-[10px] font-bold text-secondary hover:underline"
                      >
                        Voir ses créations →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Video preview card */}
            <div className="relative">
              <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl relative aspect-[4/3.2] flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1582234372722-50d7ccc30e5a?auto=format&fit=crop&q=80&w=800"
                  alt="Artisan video thumbnail"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-colors z-10" />

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="h-16 w-16 rounded-full bg-secondary hover:bg-secondary/90 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer border-2 border-white/20">
                      <Play className="h-7 w-7 fill-current ml-1" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black aspect-video border-0">
                    <iframe
                      src="https://www.youtube.com/embed/9a62E2Eep7I?autoplay=1&mute=0"
                      title="L'artisanat marocain, un héritage d'exception"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </DialogContent>
                </Dialog>

                <div className="absolute bottom-6 left-6 right-6 z-20 text-white pointer-events-none">
                  <h3 className="font-display text-xl font-bold">
                    L'artisanat marocain
                  </h3>
                  <p className="text-xs text-white/80 mt-1 font-medium">
                    Un héritage, une passion. Voir la vidéo
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. COUPS DE CŒUR DU SOUK (FEATURED PRODUCTS) */}
      <section className="py-24 bg-[#FAF7F2] border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <h2 className="font-display text-4xl font-bold text-[#1E293B]">
                Coups de cœur du souk
              </h2>
              <p className="mt-2.5 text-slate-500 text-sm">Sélectionnés rien que pour vous.</p>
            </div>
            
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: "all", label: "Tout" },
                { id: "tapis", label: "Tapis" },
                { id: "caftans", label: "Caftans" },
                { id: "bijoux", label: "Bijoux" },
                { id: "decoration", label: "Décoration" },
                { id: "babouches", label: "Babouches" },
                { id: "cuisine", label: "Cuisine" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`rounded-full px-4.5 py-2 font-bold border transition-all cursor-pointer ${
                    activeCategoryTab === tab.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              
              <Link
                to="/produits"
                className="text-xs font-bold text-secondary hover:underline ml-3 flex items-center gap-1.5"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div>
            {featuredQuery.isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white">
                <HelpCircle className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="mt-3 text-slate-600 font-medium">Aucun produit dans cette catégorie pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="animate-souk-in">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. AI STUDIO & TAPIS CONFIGURATOR SECTION */}
      <section className="py-24 relative overflow-hidden text-white font-sans bg-[#0c0d1b] border-b border-white/5">
        
        {/* Subtle background glow */}
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-orange-500/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            
            {/* Left AI Studio panel */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs text-amber-300 font-bold mb-6">
                <Sparkles className="h-4 w-4" />
                AI Studio
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                Transformez vos idées en œuvres marocaines.
              </h2>
              <p className="text-white/70 mt-4 leading-relaxed max-w-xl text-sm">
                Imaginez, personnalisez et créez des œuvres inspirées de l'artisanat marocain.
              </p>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { title: "Motif Marocain", path: "/ai-studio/image-generator", desc: "Motif zellige & arabesque", img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=300&q=80" },
                  { title: "Transformer photo", path: "/ai-studio/upscaler", desc: "Finition tadelakt & zellige", img: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=300&q=80" },
                  { title: "Créer tapis", path: "#rug-configurator", desc: "Dessinez votre tapis berbère", img: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=300&q=80" },
                  { title: "Créer lanterne", path: "/ai-studio/image-generator", desc: "Projetez des ombres ajourées", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80" },
                  { title: "Créer Caftan", path: "/ai-studio/image-generator", desc: "Broderies haute couture", img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=300&q=80" },
                  { title: "Créer logo", path: "/ai-studio/mockups", desc: "Blason traditionnel d'artisan", img: "https://images.unsplash.com/photo-1582234372722-50d7ccc30e5a?auto=format&fit=crop&w=300&q=80" }
                ].map((item) => (
                  <Link
                    key={item.title}
                    to={item.path}
                    className="group relative overflow-hidden rounded-2xl aspect-[1.1/1] border border-white/10 hover:border-amber-500/40 hover:-translate-y-0.5 transition-all text-left flex flex-col justify-end p-4 cursor-pointer"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-0" />
                    <div className="relative z-10 leading-normal">
                      <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[9px] text-white/50 mt-0.5 leading-none">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/ai-studio"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/95 text-white px-8 py-3.5 text-sm font-bold shadow-lg cursor-pointer active:scale-95 transition-transform"
                >
                  Créer avec l'IA
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Rug Configurator widget (Styled in natural tan/beige craft paper color) */}
            <div id="rug-configurator" className="rounded-3xl border border-amber-900/10 bg-[#ebdcc7] text-amber-950 p-6 md:p-8 relative scroll-mt-20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-amber-950">Concevez votre tapis</h3>
                  <p className="text-xs text-amber-900/80 mt-0.5">Configurez et brodez votre tapis berbère en temps réel.</p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-900/15 text-amber-900 px-3 py-1 rounded-full border border-amber-900/25">
                  Aperçu
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.1fr_1.2fr]">
                {/* Live SVG Display */}
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="w-full aspect-[3/4.5] max-w-[180px] rounded-xl border-2 relative overflow-hidden transition-all duration-500 flex flex-col justify-between p-3.5 shadow-2xl"
                    style={{
                      backgroundColor: rugColorsMap[rugColor].bg,
                      borderColor: rugColorsMap[rugColor].border,
                    }}
                  >
                    {/* Rug Fringes Top */}
                    <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none opacity-60">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-2 bg-amber-900/40" />
                      ))}
                    </div>

                    {/* Rug Border Design */}
                    <div
                      className={`absolute inset-2 rounded-lg opacity-35 pointer-events-none ${
                        rugBorder === "simple" ? "border border-amber-950" : rugBorder === "zellige" ? "border-2 border-dashed border-amber-950" : "border border-transparent"
                      }`}
                    />

                    {/* Rug Pattern render */}
                    <div className="w-full flex-1 flex flex-col justify-center items-center gap-4 py-4 relative z-10">
                      {rugPattern === "diamond" && (
                        <svg className="w-12 h-24 stroke-current opacity-75" style={{ color: rugColorsMap[rugColor].dot }} fill="none" viewBox="0 0 40 80">
                          <path d="M20 5 L35 25 L20 45 L5 25 Z" strokeWidth="2" />
                          <path d="M20 35 L35 55 L20 75 L5 55 Z" strokeWidth="2" />
                          <circle cx="20" cy="25" r="2" fill="currentColor" />
                          <circle cx="20" cy="55" r="2" fill="currentColor" />
                        </svg>
                      )}
                      
                      {rugPattern === "zellige" && (
                        <svg className="w-12 h-12 fill-current opacity-75" style={{ color: rugColorsMap[rugColor].dot }} viewBox="0 0 40 40">
                          <path d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z" />
                          <rect x="15" y="15" width="10" height="10" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}

                      {rugPattern === "minimal" && (
                        <div className="flex justify-around w-full h-full items-center opacity-70 px-4" style={{ color: rugColorsMap[rugColor].dot }}>
                          <div className="w-1 h-full bg-current rounded-full" />
                          <div className="w-0.5 h-full bg-current rounded-full opacity-40" />
                          <div className="w-1 h-full bg-current rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Embroidered custom name */}
                    <div className="text-center z-10">
                      {rugText ? (
                        <span
                          className="text-[9px] italic font-semibold px-2 py-0.5 bg-amber-950/80 text-amber-100 rounded-full inline-block max-w-[120px] truncate animate-pulse"
                          style={{ fontFamily: "serif" }}
                        >
                          ✍️ {rugText}
                        </span>
                      ) : (
                        <span className="text-[7px] text-amber-900/35 tracking-widest uppercase font-bold">Traditionnel</span>
                      )}
                    </div>

                    {/* Rug Fringes Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-around pointer-events-none opacity-60">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-2 bg-amber-900/40" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configurations parameters */}
                <div className="flex flex-col gap-3.5 text-xs font-bold text-amber-950">
                  {/* Colors */}
                  <div>
                    <span className="text-amber-900/70 uppercase tracking-wider text-[9px]">Couleur</span>
                    <div className="flex gap-1.5 mt-1">
                      {["cream", "indigo", "terracotta", "saffron", "emerald"].map((col) => (
                        <button
                          key={col}
                          onClick={() => setRugColor(col)}
                          className={`h-7 w-7 rounded-full border transition-all cursor-pointer ${
                            rugColor === col ? "border-amber-950 scale-110 shadow-md" : "border-amber-950/10 hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: col === "cream" ? "#fbfaf8" : col === "indigo" ? "#1e2436" : col === "terracotta" ? "#ab4c36" : col === "saffron" ? "#d97b29" : "#2a5944"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pattern */}
                  <div>
                    <span className="text-amber-900/70 uppercase tracking-wider text-[9px]">Motif</span>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {[
                        { id: "diamond", label: "Berbère" },
                        { id: "zellige", label: "Zellige" },
                        { id: "minimal", label: "Minimal" }
                      ].map((pat) => (
                        <button
                          key={pat.id}
                          onClick={() => setRugPattern(pat.id)}
                          className={`py-1 rounded-md border text-center font-bold text-[9px] transition-colors cursor-pointer ${
                            rugPattern === pat.id ? "bg-amber-950 text-white border-amber-950" : "bg-white/40 border-amber-900/10 hover:bg-white/70"
                          }`}
                        >
                          {pat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <span className="text-amber-900/70 uppercase tracking-wider text-[9px]">Dimensions</span>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {["1.5x2m", "2x3m", "3x4m"].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setRugSize(sz)}
                          className={`py-1 rounded-md border text-center font-bold text-[9px] transition-colors cursor-pointer ${
                            rugSize === sz ? "bg-amber-950 text-white border-amber-950" : "bg-white/40 border-amber-900/10 hover:bg-white/70"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border option */}
                  <div>
                    <span className="text-amber-900/70 uppercase tracking-wider text-[9px]">Bordure</span>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {[
                        { id: "none", label: "Sans" },
                        { id: "simple", label: "Simple" },
                        { id: "zellige", label: "Zellige" }
                      ].map((brd) => (
                        <button
                          key={brd.id}
                          onClick={() => setRugBorder(brd.id)}
                          className={`py-1 rounded-md border text-center font-bold text-[9px] transition-colors cursor-pointer ${
                            rugBorder === brd.id ? "bg-amber-950 text-white border-amber-950" : "bg-white/40 border-amber-900/10 hover:bg-white/70"
                          }`}
                        >
                          {brd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Text input */}
                  <div>
                    <label htmlFor="embroidery-input-live" className="text-amber-900/70 uppercase tracking-wider text-[9px]">Broderie (Prénom)</label>
                    <input
                      id="embroidery-input-live"
                      type="text"
                      maxLength={12}
                      value={rugText}
                      onChange={(e) => setRugText(e.target.value)}
                      placeholder="Tapez un nom..."
                      className="w-full mt-1 bg-white/75 border border-amber-900/10 rounded-md px-2.5 py-1.5 text-amber-950 text-xs outline-none focus:border-amber-950 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Price Summary */}
              <div className="mt-6 border-t border-amber-900/10 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900/70 font-semibold">Prix estimé :</span>
                  <div className="font-display text-2xl font-black text-amber-950 mt-0.5">
                    {calculatePrice().toLocaleString()} MAD
                  </div>
                </div>
                
                <button
                  onClick={handleConfiguratorOrder}
                  className="bg-amber-950 hover:bg-amber-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer text-xs"
                >
                  Commander mon tapis
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. WHY SOUK DIGITAL (Lucide icons with glass hover effect) */}
      <section id="why-us" className="py-24 bg-[#FAF7F2] border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold text-[#1E293B]">
              Pourquoi Souk Digital ?
            </h2>
            <p className="text-slate-500 mt-3 text-sm">
              Nous réinventons l'accès à l'artisanat marocain en alliant technologies modernes et préservation du patrimoine.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Authenticité garantie", desc: "Produits 100% fait main. Chaque pièce est certifiée par notre comité d'artisans experts.", icon: ShieldCheck },
              { title: "Traçabilité complète", desc: "De l'atelier à votre intérieur. Découvrez l'identité du maâlem et la coopérative de votre produit.", icon: MapPin },
              { title: "Paiement sécurisé", desc: "Réglez en espèces à la livraison (cash) ou en ligne via la plateforme sécurisée CMI.", icon: Lock },
              { title: "Livraison rapide", desc: "Expédition dans les 24h à 72h assurée partout au Maroc par nos partenaires logistiques.", icon: Truck },
              { title: "Artisans certifiés", desc: "Plus de 500 maâlems audités. Nous garantissons une rémunération juste et sans intermédiaire.", icon: Users },
              { title: "Support client 7j/7", desc: "Une équipe réactive et dévouée vous accompagne par WhatsApp et e-mail à chaque étape.", icon: RefreshCw }
            ].map((value) => (
              <div key={value.title} className="flex gap-4 p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-souk hover:border-primary/20 hover:scale-[1.02] transition-all duration-300 backdrop-blur-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-5.5 w-5.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{value.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. STATISTICS SECTION */}
      <section
        className="py-16 relative bg-[#120e26] border-b border-white/5 overflow-hidden flex items-center justify-center min-h-[220px]"
        style={{
          backgroundImage: "linear-gradient(rgba(18, 14, 38, 0.85), rgba(18, 14, 38, 0.85)), url('https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=1400')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4 divide-y divide-white/10 md:divide-y-0 md:divide-x divide-white/15 items-center justify-center">
            <StatCounter value="1200+" label="Produits authentiques" subtitle="En stock et sur-mesure" />
            <StatCounter value="500+" label="Artisans partenaires" subtitle="Dans 12 provinces" />
            <StatCounter value="12" label="Régions couvertes" subtitle="Livraison nationale" />
            <StatCounter value="50000+" label="Clients satisfaits" subtitle="Avis certifiés" />
            <StatCounter value="4.9/5" label="Note moyenne" subtitle="⭐⭐⭐⭐• 2k+ avis" />
          </div>
        </div>
      </section>

      {/* 8. CUSTOMER REVIEWS */}
      <section className="py-24 bg-[#FAF7F2] border-b border-slate-200/50">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-[#1E293B] mb-12">
            Ce que disent nos clients
          </h2>

          <div className="p-8 md:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm relative">
            <span className="text-6xl text-secondary/15 font-serif absolute top-4 left-6">“</span>
            <div className="relative z-10">
              <div className="flex justify-center text-amber-500 text-sm gap-0.5 mb-4">★★★★★</div>
              <p className="text-base md:text-lg leading-relaxed text-slate-700 italic font-medium">
                "La qualité du tapis Beni Ouarain commandé est tout simplement exceptionnelle ! On sent l'épaisseur et la douceur de la laine pure façonnée à la main. Livraison en 48h à Rabat avec certificat d'authenticité."
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-3.5 mt-8">
              <div className="h-10 w-10 rounded-full bg-secondary/15 flex items-center justify-center font-bold text-secondary text-sm">
                S
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-slate-900">Sara</p>
                <p className="text-[10px] text-slate-500 font-semibold">Rabat • Achat vérifié</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. INSTAGRAM GALLERY */}
      <section className="py-20 bg-[#FAF7F2] border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Suivez-nous sur Instagram
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Partagez vos photos avec le hashtag <span className="text-primary font-bold">#SoukDigital</span>.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=250&q=80",
              "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=250&q=80",
              "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=250&q=80",
              "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=250&q=80",
              "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=250&q=80",
              "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=250&q=80"
            ].map((url, i) => (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="relative overflow-hidden rounded-2xl border border-slate-200 aspect-square group block bg-slate-100 shadow-sm"
              >
                <img
                  src={url}
                  alt={`Instagram snapshot ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CULTURE BLOG SECTION */}
      <section className="py-24 bg-[#FAF7F2] border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold text-slate-900">
              Notre blog
            </h2>
            <p className="text-slate-500 mt-2.5 text-sm">Histoires, traditions et savoir-faire</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "L'histoire du zellige marocain",
                date: "15 Mai 2024",
                image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=400",
                desc: "Un art géométrique ancestral né à Fès, qui illumine les palais et séduit l'architecture moderne.",
              },
              {
                title: "Comment reconnaître un vrai tapis berbère ?",
                date: "10 Mai 2024",
                image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=400",
                desc: "Laine pure, nouage traditionnel, irrégularité créatrice... Apprenez les secrets des tisseuses de l'Atlas.",
              },
              {
                title: "Le travail du cuir à Fès",
                date: "05 Mai 2024",
                image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
                desc: "Immersion dans les tanneries millénaires de Chouara où le cuir est traité selon des recettes ancestrales.",
              },
              {
                title: "Guide des coopératives artisanales au Maroc",
                date: "01 Mai 2024",
                image: "https://images.unsplash.com/photo-1582234372722-50d7ccc30e5a?auto=format&fit=crop&q=80&w=400",
                desc: "Comment l'organisation en coopérative aide les femmes artisanes du milieu rural à valoriser leur production.",
              }
            ].map((article) => (
              <article key={article.title} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Calendar className="h-3 w-3" />
                      {article.date}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-2.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-normal font-medium">
                      {article.desc}
                    </p>
                  </div>
                  
                  <span className="text-xs text-primary font-bold inline-flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                    Lire l'article →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 11. NEWSLETTER */}
      <section className="py-20 bg-[#FAF7F2] border-t border-slate-200/50">
        <div className="mx-auto max-w-xl px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">Communauté</span>
          <h2 className="font-display text-3xl font-bold text-slate-900 mt-2">
            Rejoignez le souk connecté
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Inscrivez-vous à notre lettre d'information pour recevoir des invitations aux ventes privées d'artisans d'exception et -10% de bienvenue.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Merci pour votre inscription !");
            }}
            className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Votre email"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-slate-400 transition-colors text-slate-900 font-medium"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground font-bold py-3.5 px-6 rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md active:scale-98 cursor-pointer shrink-0"
            >
              S'abonner
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
