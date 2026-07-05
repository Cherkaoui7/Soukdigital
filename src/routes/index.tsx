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
  Tag
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
          className="absolute bg-amber-300/30 rounded-full"
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
      <div className="text-sm font-semibold text-white/90 mt-1">{label}</div>
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
      url: "https://images.unsplash.com/photo-1597212618440-806262de474b?auto=format&fit=crop&q=80&w=1000",
      title: "Riad à Marrakech",
    },
    {
      url: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&q=80&w=1000",
      title: "Ruelle Bleue de Chefchaouen",
    },
    {
      url: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=1000",
      title: "Fontaine Zellige à Fès",
    },
    {
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&q=80&w=1000",
      title: "Dunes de Merzouga au Sahara",
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
      if (activeCategoryTab === "tapis") return name.includes("tapis") || name.includes("berbère");
      if (activeCategoryTab === "caftans") return name.includes("caftan");
      if (activeCategoryTab === "bijoux") return name.includes("bijou") || name.includes("collier");
      if (activeCategoryTab === "decoration") return name.includes("lanterne") || name.includes("bougeoir") || name.includes("zellige");
      if (activeCategoryTab === "babouches") return name.includes("babouche");
      if (activeCategoryTab === "argan") return name.includes("argan") || name.includes("huile");
      return true;
    }).slice(0, 8);
  }, [featuredQuery.data, activeCategoryTab]);

  // Regions list
  const regions = [
    {
      id: "fes",
      name: "Fès-Meknès",
      title: "Fès",
      image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=400",
      crafts: ["Zellige traditionnel", "Caftans brodés", "Cuir tanné végétal"],
      desc: "Capitale spirituelle et artisanale du Royaume, célèbre pour son quartier des tanneurs et l'extrême finesse de sa céramique émaillée.",
    },
    {
      id: "marrakech",
      name: "Marrakech-Safi",
      title: "Marrakech",
      image: "https://images.unsplash.com/photo-1597212618440-806262de474b?auto=format&fit=crop&q=80&w=400",
      crafts: ["Lanternes ciselées", "Babouches en cuir", "Fer forgé"],
      desc: "La ville ocre bouillonne de créativité. Les dinandiers de la place Souk El Kimakh façonnent le laiton en luminaires magiques.",
    },
    {
      id: "essaouira",
      name: "Essaouira",
      title: "Essaouira",
      image: "https://images.unsplash.com/photo-1564507592937-25994a9015b2?auto=format&fit=crop&q=80&w=400",
      crafts: ["Huile d'Argan pure", "Ebénisterie en Thuya", "Bijoux en argent"],
      desc: "Baignée par l'Atlantique, Essaouira est le berceau de l'or liquide (Argan) et des sculpteurs sur précieux bois de Thuya.",
    },
    {
      id: "chefchaouen",
      name: "Chefchaouen",
      title: "Chefchaouen",
      image: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&q=80&w=400",
      crafts: ["Tissage en laine rhomboïdal", "Chapeaux traditionnels R'fya"],
      desc: "La perle bleue du Nord perpétue un tissage de laine rugueuse aux motifs berbères singuliers et des teintures éclatantes.",
    },
    {
      id: "tetouan",
      name: "Tétouan",
      title: "Tétouan",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400",
      crafts: ["Broderie fine (Tarj)", "Céramique émaillée fine"],
      desc: "Héritière du savoir-faire andalou, Tétouan brille par sa broderie impériale et son art décoratif du bois peint (Zouak).",
    },
    {
      id: "safi",
      name: "Safi",
      title: "Safi",
      image: "https://images.unsplash.com/photo-1610940908711-2e69888cc8b9?auto=format&fit=crop&q=80&w=400",
      crafts: ["Poterie vernissée", "Céramique de Safi"],
      desc: "Capitale de la céramique marocaine, Safi utilise une argile unique pour cuire des pièces colorées de renommée mondiale.",
    },
    {
      id: "azilal",
      name: "Azilal",
      title: "Azilal",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400",
      crafts: ["Tapis berbère Azilal", "Tissage en laine vierge"],
      desc: "Dans les hauteurs du Haut Atlas, les tisseuses expriment leur liberté artistique sur des tapis blancs parsemés de motifs colorés spontanés.",
    },
    {
      id: "ouarzazate",
      name: "Ouarzazate",
      title: "Ouarzazate",
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&q=80&w=400",
      crafts: ["Tapis de Taznakht", "Dagues d'argent"],
      desc: "Porte du Sahara, la région excelle dans le tissage de tapis de Taznakht aux colorants naturels intenses (safran, henné).",
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
      quote: "Chaque pièce est fabriquée à la main. Le métal a une âme, il suffit de l'écouter.",
    },
    {
      name: "Fatima",
      title: "Tisseuse de tapis",
      city: "Azilal",
      exp: "26 ans",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      quote: "Mon tapis raconte l'histoire de ma tribu. Les fils de laine sont les mots que je tisse.",
    },
    {
      name: "Youssef",
      title: "Artisan du cuir",
      city: "Marrakech",
      exp: "20 ans",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      quote: "Le cuir naturel s'embellit avec les années. C'est le secret d'une babouche authentique.",
    },
    {
      name: "Amina",
      title: "Artisane de zellige",
      city: "Fès",
      exp: "15 ans",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
      quote: "La patience est la clé du zellige. Tailler chaque tesselle demande une précision infinie.",
    }
  ];

  // Rug Configurator States
  const [rugColor, setRugColor] = React.useState("cream");
  const [rugPattern, setRugPattern] = React.useState("diamond");
  const [rugSize, setRugSize] = React.useState("1.5x2m");
  const [rugText, setRugText] = React.useState("");

  const rugColorsMap: Record<string, { bg: string, border: string, dot: string }> = {
    cream: { bg: "#fbfaf8", border: "#e8dfd3", dot: "#d97706" },
    indigo: { bg: "#1e2436", border: "#2d354b", dot: "#a78bfa" },
    terracotta: { bg: "#ab4c36", border: "#8c3b28", dot: "#fef08a" },
    saffron: { bg: "#d97b29", border: "#ba661e", dot: "#fef3c7" },
    emerald: { bg: "#2a5944", border: "#1f4232", dot: "#f3f4f6" },
  };

  const handleConfiguratorOrder = () => {
    alert(`Votre tapis personnalisé (${rugSize}, motif ${rugPattern}, couleur ${rugColor}, brodé au nom de "${rugText || "Aucun"}") a été configuré ! Redirection vers la commande...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* 1. HERO SECTION */}
      <section
        className="relative min-h-[100dvh] flex items-center overflow-hidden font-sans pt-16 pb-12"
        style={{
          background: "linear-gradient(135deg, #120e26 0%, #17244a 35%, #5821a8 70%, #9e390c 100%)",
        }}
      >
        <Particles />
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30L30 60L0 30Z\' fill=\'none\' stroke=\'rgba(255,255,255,0.15)\' stroke-width=\'0.8\'/%3E%3C/svg%3E')]" />

        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:px-8 py-16 lg:grid-cols-[1.1fr_1fr] items-center relative z-10 w-full">
          {/* Left Text Column */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[0.8rem] font-bold uppercase tracking-[1.5px] backdrop-blur-md animate-hero-drop text-amber-300 mb-6">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_#d97706] animate-pulse" />
              Souk Digital • L'Artisanat Connecté
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[4.2rem] font-bold leading-[1.1] text-balance mb-6 animate-hero-drop" style={{ "--hero-delay": "120ms" } as React.CSSProperties}>
              Le savoir-faire ancestral du <span className="text-amber-400">Maroc</span>, chez vous
            </h1>

            <p className="max-w-[555px] text-[1.1rem] leading-[1.65] text-white/80 animate-hero-drop mb-8" style={{ "--hero-delay": "240ms" } as React.CSSProperties}>
              Plus de 500 artisans certifiés provenant des 12 régions du Royaume. Chaque création raconte une histoire unique, façonnée à la main par nos maâlems.
            </p>

            {/* Main Buttons */}
            <div className="flex flex-wrap gap-4 animate-hero-drop mb-8" style={{ "--hero-delay": "340ms" } as React.CSSProperties}>
              <Link to="/produits" className="group relative overflow-hidden inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 px-8 py-3.5 text-sm font-bold text-gray-950 shadow-[0_8px_30px_rgba(217,119,6,0.35)] hover:shadow-[0_15px_40px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300">
                Découvrir nos créations
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#explore-regions" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 hover:border-amber-400 px-8 py-3.5 text-sm font-medium transition-all">
                Explorer les régions
              </a>
            </div>

            {/* Trust Signals Row */}
            <div className="grid grid-cols-2 gap-4 max-w-[500px] border-t border-white/10 pt-6 animate-hero-drop text-white/85 text-xs" style={{ "--hero-delay": "440ms" } as React.CSSProperties}>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span> Livraison partout au Maroc
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span> Paiement sécurisé (COD / CMI)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span> Retours 30 jours garantis
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span> Authenticité 100% certifiée
              </div>
            </div>
          </div>

          {/* Right Image Slider Column */}
          <div className="relative flex items-center justify-center min-h-[440px] md:min-h-[500px]">
            <div className="relative w-full max-w-[440px] aspect-square mx-auto">
              
              {/* Outer pulsing rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full border border-amber-500/10 animate-pulse pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-amber-500/5 animate-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

              {/* Slider Image Container */}
              <div className="w-full h-full rounded-full border-4 border-amber-500/80 overflow-hidden relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900">
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
                    <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                      <span className="bg-black/60 backdrop-blur-md text-amber-200 text-xs px-3.5 py-1.5 rounded-full font-medium tracking-wide">
                        📍 {slide.title}
                      </span>
                    </div>
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

              {/* Floating Cards (Point 1 & 4) */}
              <div className="float-item float-1 hidden sm:flex">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                  alt="Amina"
                  className="rounded-full border-2 border-amber-400"
                />
                <div>
                  <p className="font-semibold text-xs leading-tight">"Magnifique zellige !"</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">⭐⭐⭐⭐      Amina, Casa</p>
                </div>
              </div>

              <div className="float-item float-2 hidden sm:flex">
                <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-base shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white">🔥</div>
                <div>
                  <p className="font-semibold text-xs leading-tight">+1,200 ventes</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">ce mois-ci</p>
                </div>
              </div>

              <div className="float-item float-3 hidden sm:flex">
                <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-base shrink-0 bg-blue-100 text-blue-600">⚡</div>
                <div>
                  <p className="font-semibold text-xs leading-tight">Livraison ultra rapide</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Youssef, Rabat</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE REGIONS SECTION */}
      <section id="explore-regions" className="py-20 bg-background border-b border-border/50 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Identité Marocaine</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              Explorez les 12 régions du Royaume
            </h2>
            <p className="text-muted-foreground mt-3">
              Chaque province possède un savoir-faire transmis de génération en génération. Cliquez pour découvrir leur histoire et artisanat.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {regions.map((region) => (
              <Dialog key={region.id}>
                <DialogTrigger asChild>
                  <button className="group text-left relative overflow-hidden rounded-2xl border border-border/70 bg-card aspect-[4/3] p-0 cursor-pointer shadow-sm hover:shadow-souk hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
                    <img
                      src={region.image}
                      alt={region.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-10" />
                    
                    <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                      <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                        {region.name}
                      </span>
                      <h3 className="font-display text-xl font-bold mt-0.5">
                        {region.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-white/80 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Découvrir</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-secondary" />
                      Région {region.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <img
                      src={region.image}
                      alt={region.title}
                      className="w-full h-44 object-cover rounded-xl border border-border/50"
                    />
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {region.desc}
                    </p>
                    
                    <div className="mt-5 border-t border-border/50 pt-4">
                      <h4 className="font-display text-sm font-bold text-foreground">Savoir-faire emblématiques :</h4>
                      <ul className="mt-2.5 space-y-2">
                        {region.crafts.map((craft) => (
                          <li key={craft} className="flex items-center gap-2.5 text-xs text-foreground">
                            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                            {craft}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Link
                        to="/produits"
                        search={{ search: region.title }}
                        className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold hover:bg-primary/95 transition-colors"
                      >
                        Voir les produits de la région
                      </Link>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}

            {/* Placeholder card "Voir toutes" */}
            <Link
              to="/produits"
              className="group flex flex-col justify-center items-center text-center rounded-2xl border border-dashed border-border bg-muted/40 aspect-[4/3] p-6 hover:bg-muted/80 hover:border-primary/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                ⵣ
              </div>
              <p className="font-display text-lg font-bold text-foreground mt-3">
                Voir toutes
              </p>
              <p className="text-xs text-muted-foreground mt-1">12 régions du Royaume</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. ARTISANS SECTION */}
      <section id="artisans" className="py-20 bg-muted/30 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
            
            {/* Left Side: Artisans list */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Gardiens du savoir-faire</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
                Nos artisans, porteurs d'histoire
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl">
                Derrière chaque création se cache un maâlem ou une tisseuse. Nous soutenons directement plus de 500 familles à travers le pays.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {artisans.map((artisan) => (
                  <div key={artisan.name} className="flex gap-4 p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={artisan.image}
                      alt={artisan.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-amber-500/30 shrink-0"
                    />
                    <div className="leading-tight">
                      <h3 className="font-display text-lg font-bold text-foreground">
                        👳 {artisan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {artisan.title} • {artisan.city}
                      </p>
                      <p className="text-[11px] text-amber-500 font-bold mt-1">
                        ⭐⭐⭐⭐⭐ ({artisan.exp} d'expérience)
                      </p>
                      <p className="text-xs italic text-muted-foreground mt-2.5 border-l-2 border-amber-400 pl-2">
                        "{artisan.quote}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Video preview card (Point 5) */}
            <div className="relative">
              <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xl relative aspect-[4/3] flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1582234372722-50d7ccc30e5a?auto=format&fit=crop&q=80&w=800"
                  alt="Artisan video thumbnail"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors z-10" />

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="h-16 w-16 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-900 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer">
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
                  <p className="text-xs text-white/80 mt-1">
                    Un héritage millénaire, une passion vivante. Regarder la vidéo (30s)
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. IMMERSIVE CATEGORIES GRID */}
      <section id="categories" className="py-20 bg-background border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Explorer le souk</span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-1 sm:text-4xl">
                Nos souks thématiques
              </h2>
              <p className="mt-2 text-muted-foreground">Découvrez nos créations classées par univers.</p>
            </div>
            <Link
              to="/produits"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Tout voir →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {categoriesQuery.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
              ))}
            {categoriesQuery.data?.map((cat) => {
              const bgImg = categoryImages[cat.slug] || fallbackCategoryImage;
              return (
                <Link
                  key={cat.id}
                  to="/produits"
                  search={{ category: cat.slug }}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/5] border border-border/70 shadow-sm hover:shadow-souk hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <img
                    src={bgImg}
                    alt={cat.name_fr}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-10" />
                  
                  <div className="absolute bottom-4 left-4 right-4 z-20 text-white text-center">
                    <p className="font-display text-lg font-bold group-hover:text-amber-300 transition-colors">
                      {localizedField(cat, locale as Locale, "name")}
                    </p>
                    <p className="text-[10px] text-white/60 tracking-wider uppercase mt-1">
                      Découvrir
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. COUPS DE CŒUR DU SOUK (FEATURED PRODUCTS WITH STORY) */}
      <section className="py-20 bg-background border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Notre Sélection</span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-1 sm:text-4xl">
                Coups de cœur du souk
              </h2>
              <p className="mt-2 text-muted-foreground">Sélectionnés avec passion pour embellir votre intérieur.</p>
            </div>
            
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "all", label: "Tout" },
                { id: "tapis", label: "Tapis" },
                { id: "caftans", label: "Caftans" },
                { id: "bijoux", label: "Bijoux" },
                { id: "decoration", label: "Décoration" },
                { id: "babouches", label: "Babouches" },
                { id: "argan", label: "Huile d'argan" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`rounded-full px-4 py-2 font-semibold border transition-all cursor-pointer ${
                    activeCategoryTab === tab.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {featuredQuery.isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-3xl">
                <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="mt-3 text-muted-foreground font-medium">Aucun coup de cœur dans cette catégorie pour le moment.</p>
                <Link to="/produits" className="mt-4 inline-flex text-xs font-bold text-primary hover:underline">
                  Voir tout le souk →
                </Link>
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
          
          <div className="mt-12 text-center">
            <Link
              to="/produits"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-muted hover:border-primary/20 transition-all"
            >
              Voir toutes nos créations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 6. AI STUDIO & TAPIS CONFIGURATOR SECTION */}
      <section className="py-24 relative overflow-hidden text-white font-sans bg-[#08080f] border-b border-white/5">
        
        {/* Subtle background glow */}
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-majorelle/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-sabra/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            
            {/* Left AI Studio panel */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs text-amber-300 font-bold mb-6">
                <Sparkles className="h-4 w-4" />
                AI Studio
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                Transformez vos idées en œuvres marocaines
              </h2>
              <p className="text-white/70 mt-4 leading-relaxed max-w-xl">
                Notre intelligence artificielle comprend l'âme géométrique du zellige, les symboles berbères et l'harmonie des caftans. Générez ou personnalisez en quelques clics.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Générer un motif zellige", path: "/ai-studio/image-generator", desc: "Créez des mosaïques infinies." },
                  { title: "Personnaliser un tapis", path: "#rug-configurator", desc: "Brodez et ajustez vos coloris." },
                  { title: "Créer une lanterne unique", path: "/ai-studio/image-generator", desc: "Dessinez les ombres projetées." },
                  { title: "Transformer votre photo", path: "/ai-studio/upscaler", desc: "Sublimez vos clichés en zellige." }
                ].map((item) => (
                  <Link
                    key={item.title}
                    to={item.path}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/40 hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <h3 className="font-semibold text-sm group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1">{item.desc}</p>
                  </Link>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/ai-studio"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 px-8 py-3.5 text-sm font-bold shadow-lg"
                >
                  Ouvrir l'AI Studio
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Rug Configurator widget */}
            <div id="rug-configurator" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 relative scroll-mt-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold">Configurez votre tapis</h3>
                  <p className="text-xs text-white/60 mt-0.5">Choisissez vos couleurs, motifs et personnalisations</p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
                  Aperçu Live
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                {/* Live SVG Display */}
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="w-full aspect-[3/4.5] max-w-[200px] rounded-xl border-2 relative overflow-hidden transition-all duration-500 flex flex-col justify-between p-3.5 shadow-xl"
                    style={{
                      backgroundColor: rugColorsMap[rugColor].bg,
                      borderColor: rugColorsMap[rugColor].border,
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none opacity-60">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-2 bg-amber-700/40" />
                      ))}
                    </div>

                    <div
                      className="absolute inset-2 border-2 border-dashed rounded-lg opacity-35 pointer-events-none"
                      style={{ borderColor: rugColorsMap[rugColor].dot }}
                    />

                    <div className="w-full flex-1 flex flex-col justify-center items-center gap-4 py-4 relative z-10">
                      {rugPattern === "diamond" && (
                        <svg className="w-12 h-24 stroke-current opacity-70" style={{ color: rugColorsMap[rugColor].dot }} fill="none" viewBox="0 0 40 80">
                          <path d="M20 5 L35 25 L20 45 L5 25 Z" strokeWidth="1.5" />
                          <path d="M20 35 L35 55 L20 75 L5 55 Z" strokeWidth="1.5" />
                          <circle cx="20" cy="25" r="2" fill="currentColor" />
                          <circle cx="20" cy="55" r="2" fill="currentColor" />
                        </svg>
                      )}
                      
                      {rugPattern === "zellige" && (
                        <svg className="w-14 h-14 fill-current opacity-60" style={{ color: rugColorsMap[rugColor].dot }} viewBox="0 0 40 40">
                          <path d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z" />
                          <rect x="15" y="15" width="10" height="10" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}

                      {rugPattern === "minimal" && (
                        <div className="flex justify-around w-full h-full items-center opacity-65 px-4" style={{ color: rugColorsMap[rugColor].dot }}>
                          <div className="w-1.5 h-full bg-current rounded-full" />
                          <div className="w-0.5 h-full bg-current rounded-full opacity-50" />
                          <div className="w-1.5 h-full bg-current rounded-full" />
                        </div>
                      )}
                    </div>

                    <div className="text-center z-10">
                      {rugText ? (
                        <span
                          className="text-[9px] italic font-semibold px-2 py-0.5 bg-black/40 text-amber-200 rounded-full inline-block max-w-[120px] truncate"
                          style={{ fontFamily: "serif" }}
                        >
                          ✍️ {rugText}
                        </span>
                      ) : (
                        <span className="text-[7px] text-white/30 tracking-widest uppercase">Traditionnel</span>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 flex justify-around pointer-events-none opacity-60">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-2 bg-amber-700/40" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configurations parameters */}
                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <span className="font-bold text-white/80 uppercase tracking-wide">Coloris</span>
                    <div className="flex gap-2 mt-2">
                      {["cream", "indigo", "terracotta", "saffron", "emerald"].map((col) => (
                        <button
                          key={col}
                          onClick={() => setRugColor(col)}
                          className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                            rugColor === col ? "border-amber-400 scale-110 shadow-md" : "border-white/10 hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: col === "cream" ? "#fbfaf8" : col === "indigo" ? "#1e2436" : col === "terracotta" ? "#ab4c36" : col === "saffron" ? "#d97b29" : "#2a5944"
                          }}
                          title={col}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-white/80 uppercase tracking-wide">Motif</span>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { id: "diamond", label: "Berbère" },
                        { id: "zellige", label: "Zellige" },
                        { id: "minimal", label: "Minimal" }
                      ].map((pat) => (
                        <button
                          key={pat.id}
                          onClick={() => setRugPattern(pat.id)}
                          className={`px-3 py-1.5 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                            rugPattern === pat.id
                              ? "bg-amber-400 text-gray-900 border-amber-400 font-semibold"
                              : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {pat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-white/80 uppercase tracking-wide">Taille</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["1.5x2m", "2x3m"].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setRugSize(sz)}
                          className={`px-3 py-1.5 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                            rugSize === sz
                              ? "bg-amber-400 text-gray-900 border-amber-400 font-semibold"
                              : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="embroidery-input" className="font-bold text-white/80 uppercase tracking-wide">Prénom / Initiales brodés</label>
                    <input
                      id="embroidery-input"
                      type="text"
                      maxLength={15}
                      value={rugText}
                      onChange={(e) => setRugText(e.target.value)}
                      placeholder="Ex : Amina (Max 15 car.)"
                      className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-400/80 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfiguratorOrder}
                className="w-full mt-6 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
              >
                Commander mon design personnalisé
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 7. "POURQUOI NOUS" SECTION */}
      <section id="why-us" className="py-20 bg-background border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Notre Engagement</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              Pourquoi choisir Souk Digital ?
            </h2>
            <p className="text-muted-foreground mt-3">
              Nous réinventons l'accès à l'artisanat marocain en alliant technologies modernes et préservation du patrimoine.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Authenticité garantie", desc: "Produits 100% fait main. Chaque pièce est certifiée conforme par notre comité d'artisans experts.", icon: ShieldCheck },
              { title: "Traçabilité complète", desc: "De l'atelier à votre intérieur. Découvrez l'identité du maâlem et la coopérative derrière votre produit.", icon: MapPin },
              { title: "Paiement sécurisé", desc: "Commandez en toute sérénité. Réglez à la livraison (cash) ou en ligne par carte via la plateforme CMI.", icon: ShieldCheck },
              { title: "Livraison rapide", desc: "Expédition dans les 24h à 72h. Couverture complète de toutes les provinces par nos partenaires Amana / Aramex.", icon: Truck },
              { title: "Artisans certifiés", desc: "Plus de 500 maâlems audités. Nous garantissons une rémunération équitable et préservons les métiers d'art.", icon: Users },
              { title: "Support client 7j/7", desc: "Une équipe à votre écoute. Nous vous accompagnons par WhatsApp et e-mail à chaque étape de votre commande.", icon: RefreshCw }
            ].map((value, i) => (
              <div key={value.title} className="flex gap-4 p-6 rounded-2xl bg-card border border-border/70 shadow-sm hover:shadow-souk transition-all duration-300">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ANIMATED STATISTICS BANNER */}
      <section className="py-14 bg-gradient-to-r from-primary to-majorelle-deep border-b border-border/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4 divide-y divide-white/10 md:divide-y-0 md:divide-x divide-white/10 items-center justify-center">
            <StatCounter value="1200+" label="Produits authentiques" subtitle="En stock et sur-mesure" />
            <StatCounter value="500+" label="Artisans certifiés" subtitle="Dans 12 provinces" />
            <StatCounter value="12" label="Régions couvertes" subtitle="Livraison nationale" />
            <StatCounter value="50000+" label="Clients satisfaits" subtitle="Avis certifiés" />
            <StatCounter value="4.9/5" label="Note moyenne" subtitle="Basé sur 2000+ avis" />
          </div>
        </div>
      </section>

      {/* 9. PRODUCT JOURNEY TIMELINE */}
      <section className="py-20 bg-background border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Le Parcours</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              De l'atelier traditionnel à votre maison
            </h2>
            <p className="text-muted-foreground mt-3">
              Découvrez les étapes du circuit court que nous mettons en place pour valoriser l'artisanat marocain.
            </p>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/80 hidden lg:block -translate-y-1/2 z-0" />

            <div className="grid gap-8 lg:grid-cols-5 relative z-10">
              {[
                { step: "01", title: "L'artisan", desc: "Fabrication manuelle soignée dans les ateliers traditionnels de Fès, Marrakech ou des montagnes de l'Atlas." },
                { step: "02", title: "Contrôle qualité", desc: "Inspection rigoureuse de chaque pièce (couture, polissage, cuisson de la poterie) par notre comité d'experts." },
                { step: "03", title: "Souk Digital", desc: "Emballage soigné et écologique qui protège le produit et en raconte l'histoire avec un livret dédié." },
                { step: "04", title: "Livraison rapide", desc: "Prise en charge prioritaire par Amana / Aramex avec suivi SMS en temps réel." },
                { step: "05", title: "Maison du client", desc: "Votre intérieur s'habille de l'âme du Maroc, apportant chaleur et authenticité à votre foyer." }
              ].map((item) => (
                <div key={item.step} className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm text-center hover:-translate-y-1 transition-transform">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
                    {item.step}
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10. REVIEWS, INSTAGRAM & NEWSLETTER ROW */}
      <section className="py-20 bg-muted/20 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr_0.8fr]">
            
            {/* Reviews Carousel placeholder */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Témoignages</span>
                <h3 className="font-display text-2xl font-bold text-foreground mt-2">
                  Ils parlent de nous
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Les avis de nos clients du Royaume.</p>
              </div>

              <div className="mt-6 p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex-1 flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="flex text-amber-400 text-sm tracking-wide mb-3">★★★★★</div>
                  <p className="text-xs text-foreground italic leading-relaxed">
                    "La qualité du tapis Beni Ouarain est exceptionnelle ! On sent le vrai travail artisanal. Livré en 48h à Rabat."
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-primary text-xs">
                    S
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-foreground">Sara, Rabat</p>
                    <p className="text-[10px] text-muted-foreground">Achat vérifié</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instagram gallery */}
            <div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Instagram</span>
                <h3 className="font-display text-2xl font-bold text-foreground mt-2">
                  Rejoignez la communauté
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Partagez vos photos avec le hashtag <span className="font-bold text-primary">#SoukDigital</span>.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=150&q=80"
                ].map((url, i) => (
                  <a
                    key={i}
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="relative overflow-hidden rounded-xl border border-border/80 aspect-square group block"
                  >
                    <img
                      src={url}
                      alt={`Instagram ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Instagram className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter Container */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Lettre d'information</span>
                <h3 className="font-display text-2xl font-bold text-foreground mt-2">
                  Newsletter
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Restez informé de nos nouveautés.</p>
              </div>

              <div className="mt-6 p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex-1 flex flex-col justify-center">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("Merci pour votre inscription !");
                  }}
                  className="space-y-3.5"
                >
                  <input
                    type="email"
                    required
                    placeholder="Votre email..."
                    className="w-full bg-muted/50 border border-border/80 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary transition-colors text-foreground"
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    S'abonner
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Recevez -10% sur votre première commande
                  </p>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. CULTURE BLOG SECTION */}
      <section className="py-20 bg-background border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Culture & Savoir-faire</span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-1 sm:text-4xl">
                Notre blog culturel
              </h2>
              <p className="mt-2 text-muted-foreground">Plongez dans l'histoire passionnante de l'artisanat marocain.</p>
            </div>
            <Link
              to="/produits"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Voir le blog →
            </Link>
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
              <article key={article.title} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {article.date}
                    </span>
                    <h3 className="font-display text-base font-bold text-foreground mt-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
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

      {/* 12. FAQ SECTION */}
      <section id="faq" className="py-20 bg-background scroll-mt-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Questions Fréquentes</span>
            <h2 className="font-display text-3xl font-bold text-foreground mt-2">
              Foire Aux Questions (FAQ)
            </h2>
            <p className="text-muted-foreground mt-2">Trouvez rapidement les réponses à vos questions.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="shipping" className="border border-border rounded-xl px-5 bg-card shadow-sm">
              <AccordionTrigger className="font-display text-base font-bold text-foreground hover:no-underline">
                Quels sont les délais et tarifs de livraison ?
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground pt-1 pb-4">
                Nous livrons partout au Maroc sous 24h à 72h via nos partenaires Amana et Aramex. La livraison est offerte à partir de 300 MAD pour les membres Carte Zellige Argent et Or. Pour les autres, un tarif forfaitaire de 30 MAD s'applique.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="authenticity" className="border border-border rounded-xl px-5 bg-card shadow-sm">
              <AccordionTrigger className="font-display text-base font-bold text-foreground hover:no-underline">
                Comment garantissez-vous l'authenticité des produits ?
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground pt-1 pb-4">
                Chaque création vendue sur Souk Digital est livrée avec un certificat d'authenticité contenant un QR Code. Ce code vous permet de tracer le produit jusqu'à la coopérative ou au maâlem qui l'a conçu. Nous ne travaillons qu'avec des artisans locaux certifiés.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund" className="border border-border rounded-xl px-5 bg-card shadow-sm">
              <AccordionTrigger className="font-display text-base font-bold text-foreground hover:no-underline">
                Quelle est votre politique de retour ?
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground pt-1 pb-4">
                Si une création ne vous donne pas entière satisfaction, vous disposez de 30 jours pour effectuer un retour gratuit. Il vous suffit de déposer le produit dans l'un de nos points relais partenaires, et nous procéderons à un échange ou remboursement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment" className="border border-border rounded-xl px-5 bg-card shadow-sm">
              <AccordionTrigger className="font-display text-base font-bold text-foreground hover:no-underline">
                Quels sont les modes de paiement acceptés ?
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground pt-1 pb-4">
                Nous acceptons le paiement en espèces à la livraison (COD) partout au Maroc. Vous pouvez également régler de manière sécurisée par carte bancaire marocaine ou internationale sur notre site, via la passerelle Centre Monétique Interbancaire (CMI).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cooperatives" className="border border-border rounded-xl px-5 bg-card shadow-sm">
              <AccordionTrigger className="font-display text-base font-bold text-foreground hover:no-underline">
                Comment soutenez-vous directement les coopératives ?
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground pt-1 pb-4">
                Nous appliquons les règles du commerce équitable. 80% du prix de vente hors frais logistiques revient directement aux coopératives et maâlems partenaires. Nous leur donnons un accès direct au marché national et international sans intermédiaire abusif.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
