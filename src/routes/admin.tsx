import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, ShoppingBag, Layers, Users, Trash2, Plus, Save, Shield, Star, BarChart3, Check, X, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { broadcastPush } from "@/lib/push.functions";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { sendShippingNotification } from "@/lib/emails.functions";
import { formatPrice } from "@/lib/format";
import { ProductImageUpload } from "@/components/admin/ProductImageUpload";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Artisan = Database["public"]["Tables"]["artisans"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · Souk Digital" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-3xl font-bold">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette zone est réservée aux administrateurs du souk. Contactez un admin pour obtenir le rôle
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">admin</code>.
          </p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold">Back-office du souk</h1>
            <p className="text-sm text-muted-foreground">Gestion produits, commandes, catégories et artisans.</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="mt-8">
          <TabsList className="flex-wrap">
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 me-1.5" />Analytics</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 me-1.5" />Commandes</TabsTrigger>
            <TabsTrigger value="products"><Package className="h-4 w-4 me-1.5" />Produits</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="h-4 w-4 me-1.5" />Avis</TabsTrigger>
            <TabsTrigger value="categories"><Layers className="h-4 w-4 me-1.5" />Catégories</TabsTrigger>
            <TabsTrigger value="artisans"><Users className="h-4 w-4 me-1.5" />Artisans</TabsTrigger>
            <TabsTrigger value="push"><Send className="h-4 w-4 me-1.5" />Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
          <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
          <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
          <TabsContent value="reviews" className="mt-6"><ReviewsTab /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
          <TabsContent value="artisans" className="mt-6"><ArtisansTab /></TabsContent>
          <TabsContent value="push" className="mt-6"><PushTab /></TabsContent>
        </Tabs>

      </section>
      <SiteFooter />
    </div>
  );
}

// ---------- ORDERS ----------
const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée",
};

function OrdersTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function updateStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Statut mis à jour");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  async function updateTracking(id: string, tracking_number: string) {
    const value = tracking_number.trim() || null;
    const previous = data?.find((o) => o.id === id)?.tracking_number ?? null;
    const { error } = await supabase.from("orders").update({ tracking_number: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Numéro Amana enregistré");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });

    // Fire shipping email only when a tracking number is first set (or changed to a new value).
    if (value && value !== previous) {
      try {
        const res = await sendShippingNotification({ data: { orderId: id } });
        if (res?.ok) toast.success("Email d'expédition envoyé");
      } catch {
        // silent — email is best-effort
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
            <TableHead>Ville</TableHead><TableHead>Articles</TableHead><TableHead>Total</TableHead>
            <TableHead>Paiement</TableHead><TableHead>Statut</TableHead><TableHead>Suivi Amana</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</TableCell>
              <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString("fr-MA")}</TableCell>
              <TableCell>
                <div className="font-medium">{o.full_name}</div>
                <div className="text-xs text-muted-foreground">{o.phone}</div>
              </TableCell>
              <TableCell>{o.city}</TableCell>
              <TableCell>{o.order_items?.length ?? 0}</TableCell>
              <TableCell className="font-semibold">{formatPrice(Number(o.total_mad), "fr")}</TableCell>
              <TableCell className="text-xs uppercase">{o.payment_method}</TableCell>
              <TableCell>
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                  <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  defaultValue={o.tracking_number ?? ""}
                  onBlur={(e) => {
                    if ((e.target.value || "") !== (o.tracking_number ?? "")) updateTracking(o.id, e.target.value);
                  }}
                  placeholder="AMN…"
                  className="h-8 w-32 font-mono text-xs"
                />
              </TableCell>
            </TableRow>
          ))}
          {data && data.length === 0 && (
            <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucune commande.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------- PRODUCTS ----------
function ProductsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort")).data ?? [],
  });
  const { data: artisans } = useQuery({
    queryKey: ["admin-artisans-list"],
    queryFn: async () => (await supabase.from("artisans").select("id,name,city").order("name")).data ?? [],
  });

  async function remove(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produit supprimé");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function save() {
    if (!editing) return;
    const payload = {
      slug: editing.slug ?? "",
      name_fr: editing.name_fr ?? "",
      name_ar: editing.name_ar ?? editing.name_fr ?? "",
      name_en: editing.name_en ?? editing.name_fr ?? "",
      description_fr: editing.description_fr ?? null,
      description_ar: editing.description_ar ?? null,
      description_en: editing.description_en ?? null,
      price_mad: Number(editing.price_mad ?? 0),
      min_price_mad: Number(editing.min_price_mad ?? Math.round(Number(editing.price_mad ?? 0) * 0.7)),
      old_price_mad: editing.old_price_mad != null ? Number(editing.old_price_mad) : null,
      stock: Number(editing.stock ?? 0),
      image_url: editing.image_url ?? null,
      origin_city: editing.origin_city ?? null,
      artisan_name: editing.artisan_name ?? null,
      artisan_id: editing.artisan_id ?? null,
      category_id: editing.category_id ?? null,
      featured: !!editing.featured,
    };
    const q = editing.id
      ? supabase.from("products").update(payload).eq("id", editing.id)
      : supabase.from("products").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Produit enregistré");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ price_mad: 0, stock: 10, featured: false })}>
          <Plus className="h-4 w-4 me-1.5" />Nouveau produit
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead><TableHead>Slug</TableHead><TableHead>Prix</TableHead>
              <TableHead>Min.</TableHead><TableHead>Stock</TableHead><TableHead>Ville</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name_fr}</TableCell>
                <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                <TableCell>{formatPrice(Number(p.price_mad), "fr")}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatPrice(Number(p.min_price_mad), "fr")}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{p.origin_city ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>Éditer</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Éditer le produit" : "Nouveau produit"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Ville d'origine"><Input value={editing.origin_city ?? ""} onChange={(e) => setEditing({ ...editing, origin_city: e.target.value })} /></Field>
              <Field label="Nom FR"><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></Field>
              <Field label="Nom AR"><Input dir="rtl" value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></Field>
              <Field label="Nom EN"><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></Field>
              <div className="col-span-2">
                <Field label="Image">
                  <ProductImageUpload
                    value={editing.image_url}
                    slug={editing.slug}
                    onChange={(url) => setEditing({ ...editing, image_url: url })}
                  />
                </Field>
              </div>
              <Field label="Prix (MAD)"><Input type="number" value={editing.price_mad ?? 0} onChange={(e) => setEditing({ ...editing, price_mad: Number(e.target.value) })} /></Field>
              <Field label="Prix plancher (MAD)"><Input type="number" value={editing.min_price_mad ?? 0} onChange={(e) => setEditing({ ...editing, min_price_mad: Number(e.target.value) })} /></Field>
              <Field label="Ancien prix (MAD)"><Input type="number" value={editing.old_price_mad ?? ""} onChange={(e) => setEditing({ ...editing, old_price_mad: e.target.value ? Number(e.target.value) : null })} /></Field>
              <Field label="Stock"><Input type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></Field>
              <Field label="Catégorie">
                <Select value={editing.category_id ?? ""} onValueChange={(v) => setEditing({ ...editing, category_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_fr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Artisan">
                <Select value={editing.artisan_id ?? ""} onValueChange={(v) => setEditing({ ...editing, artisan_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {artisans?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="col-span-2">
                <Field label="Description FR"><Textarea rows={3} value={editing.description_fr ?? ""} onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })} /></Field>
              </div>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                Coup de cœur (mis en avant sur l'accueil)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save}><Save className="h-4 w-4 me-1.5" />Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- CATEGORIES ----------
function CategoriesTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort")).data ?? [],
  });

  async function save() {
    if (!editing) return;
    const payload = {
      slug: editing.slug ?? "",
      name_fr: editing.name_fr ?? "",
      name_ar: editing.name_ar ?? editing.name_fr ?? "",
      name_en: editing.name_en ?? editing.name_fr ?? "",
      icon: editing.icon ?? null,
      sort: Number(editing.sort ?? 0),
    };
    const q = editing.id ? supabase.from("categories").update(payload).eq("id", editing.id) : supabase.from("categories").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Catégorie enregistrée");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-categories-full"] });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-categories-full"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ sort: (data?.length ?? 0) + 1 })}><Plus className="h-4 w-4 me-1.5" />Nouvelle catégorie</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Slug</TableHead><TableHead>Icône</TableHead><TableHead>Ordre</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name_fr}</TableCell>
                <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                <TableCell>{c.icon}</TableCell>
                <TableCell>{c.sort}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>Éditer</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Éditer la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Icône (emoji)"><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></Field>
              <Field label="Nom FR"><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></Field>
              <Field label="Nom AR"><Input dir="rtl" value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></Field>
              <Field label="Nom EN"><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></Field>
              <Field label="Ordre"><Input type="number" value={editing.sort ?? 0} onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save}><Save className="h-4 w-4 me-1.5" />Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- ARTISANS ----------
function ArtisansTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Artisan> | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-artisans-full"],
    queryFn: async () => (await supabase.from("artisans").select("*").order("name")).data ?? [],
  });

  async function save() {
    if (!editing) return;
    const payload = {
      slug: editing.slug ?? "",
      name: editing.name ?? "",
      city: editing.city ?? "",
      region: editing.region ?? null,
      craft_fr: editing.craft_fr ?? "",
      craft_ar: editing.craft_ar ?? editing.craft_fr ?? "",
      craft_en: editing.craft_en ?? editing.craft_fr ?? "",
      bio_fr: editing.bio_fr ?? null,
      bio_ar: editing.bio_ar ?? null,
      bio_en: editing.bio_en ?? null,
      portrait_url: editing.portrait_url ?? null,
      years_experience: editing.years_experience != null ? Number(editing.years_experience) : null,
      featured: !!editing.featured,
    };
    const q = editing.id ? supabase.from("artisans").update(payload).eq("id", editing.id) : supabase.from("artisans").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Artisan enregistré");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-artisans-full"] });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cet artisan ?")) return;
    const { error } = await supabase.from("artisans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-artisans-full"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ featured: false })}><Plus className="h-4 w-4 me-1.5" />Nouvel artisan</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Ville</TableHead><TableHead>Savoir-faire</TableHead><TableHead>Exp.</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{a.city}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.craft_fr}</TableCell>
                <TableCell>{a.years_experience ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>Éditer</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Éditer l'artisan" : "Nouvel artisan"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Nom"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Ville"><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
              <Field label="Région"><Input value={editing.region ?? ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} /></Field>
              <Field label="Savoir-faire FR"><Input value={editing.craft_fr ?? ""} onChange={(e) => setEditing({ ...editing, craft_fr: e.target.value })} /></Field>
              <Field label="Savoir-faire AR"><Input dir="rtl" value={editing.craft_ar ?? ""} onChange={(e) => setEditing({ ...editing, craft_ar: e.target.value })} /></Field>
              <Field label="Savoir-faire EN"><Input value={editing.craft_en ?? ""} onChange={(e) => setEditing({ ...editing, craft_en: e.target.value })} /></Field>
              <Field label="Années d'expérience"><Input type="number" value={editing.years_experience ?? ""} onChange={(e) => setEditing({ ...editing, years_experience: e.target.value ? Number(e.target.value) : null })} /></Field>
              <div className="col-span-2"><Field label="Portrait URL"><Input value={editing.portrait_url ?? ""} onChange={(e) => setEditing({ ...editing, portrait_url: e.target.value })} /></Field></div>
              <div className="col-span-2"><Field label="Bio FR"><Textarea rows={3} value={editing.bio_fr ?? ""} onChange={(e) => setEditing({ ...editing, bio_fr: e.target.value })} /></Field></div>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                Mettre en avant
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save}><Save className="h-4 w-4 me-1.5" />Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ---------- REVIEWS ----------
type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  products: { name_fr: string; slug: string } | null;
};

function ReviewsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id,product_id,user_id,rating,title,body,status,created_at, products(name_fr, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ReviewRow[];
    },
  });

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    const { error } = await supabase.from("product_reviews").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Avis mis à jour");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Avis</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("fr-MA")}</TableCell>
              <TableCell className="font-medium">{r.products?.name_fr ?? "—"}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-secondary">
                  {r.rating} <Star className="h-3.5 w-3.5 fill-current" />
                </span>
              </TableCell>
              <TableCell className="max-w-md">
                {r.title && <p className="font-semibold">{r.title}</p>}
                {r.body && <p className="text-xs text-muted-foreground line-clamp-2">{r.body}</p>}
              </TableCell>
              <TableCell>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.status === "approved" ? "bg-zellige/15 text-zellige" :
                  r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-accent/20 text-accent-foreground"
                }`}>{r.status}</span>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {r.status !== "approved" && (
                  <Button variant="ghost" size="sm" onClick={() => setStatus(r.id, "approved")} title="Approuver">
                    <Check className="h-4 w-4 text-zellige" />
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button variant="ghost" size="sm" onClick={() => setStatus(r.id, "rejected")} title="Rejeter">
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {data && data.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun avis à modérer.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------- ANALYTICS ----------
function AnalyticsTab() {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [orders, products, users, reviews] = await Promise.all([
        supabase.from("orders").select("id,total_mad,status,city,created_at,order_items(product_name,quantity,price_mad)").order("created_at", { ascending: false }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("product_reviews").select("id,status"),
      ]);
      return {
        orders: orders.data ?? [],
        productCount: products.count ?? 0,
        userCount: users.count ?? 0,
        reviews: reviews.data ?? [],
      };
    },
  });

  if (!data) return <div className="text-muted-foreground">Chargement…</div>;

  const orders = data.orders;
  const paidOrders = orders.filter((o) => o.status !== "cancelled");
  const revenue = paidOrders.reduce((s, o) => s + Number(o.total_mad), 0);
  const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0;
  const pendingReviews = data.reviews.filter((r) => r.status === "pending").length;

  // Top products
  const productSales = new Map<string, { qty: number; revenue: number }>();
  for (const o of paidOrders) {
    for (const it of (o.order_items ?? [])) {
      const cur = productSales.get(it.product_name) ?? { qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += Number(it.price_mad) * it.quantity;
      productSales.set(it.product_name, cur);
    }
  }
  const topProducts = Array.from(productSales.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  // Top cities
  const citySales = new Map<string, number>();
  for (const o of paidOrders) {
    citySales.set(o.city, (citySales.get(o.city) ?? 0) + Number(o.total_mad));
  }
  const topCities = Array.from(citySales.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCity = topCities[0]?.[1] ?? 1;

  // Last 14 days revenue
  const days: { label: string; value: number }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    days.push({ label: d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" }), value: 0 });
  }
  for (const o of paidOrders) {
    const d = new Date(o.created_at); d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 14) days[13 - diff].value += Number(o.total_mad);
  }
  const maxDay = Math.max(...days.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenu total" value={formatPrice(revenue, "fr")} />
        <Stat label="Commandes" value={paidOrders.length.toString()} sub={`${orders.length - paidOrders.length} annulées`} />
        <Stat label="Panier moyen" value={formatPrice(avgOrder, "fr")} />
        <Stat label="Avis en attente" value={pendingReviews.toString()} sub={`${data.productCount} produits · ${data.userCount} clients`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold">Revenu · 14 derniers jours</h3>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1" title={`${d.label} · ${formatPrice(d.value, "fr")}`}>
                <div className="w-full rounded-t bg-primary/80" style={{ height: `${(d.value / maxDay) * 100}%`, minHeight: 2 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{days[0].label}</span>
            <span>{days[days.length - 1].label}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold">Top villes</h3>
          <ul className="mt-4 space-y-3">
            {topCities.length === 0 && <li className="text-sm text-muted-foreground">Pas encore de commande.</li>}
            {topCities.map(([city, val]) => (
              <li key={city}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{city}</span>
                  <span className="text-muted-foreground">{formatPrice(val, "fr")}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${(val / maxCity) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">Top produits</h3>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité vendue</TableHead>
                <TableHead className="text-right">Chiffre d'affaires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Pas encore de vente.</TableCell></TableRow>
              )}
              {topProducts.map(([name, s]) => (
                <TableRow key={name}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="text-right">{s.qty}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(s.revenue, "fr")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-primary">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}


function PushTab() {
  const send = useServerFn(broadcastPush);
  const [title, setTitle] = useState("Nouveau au souk");
  const [body, setBody] = useState("Découvre les dernières trouvailles de nos maâlems.");
  const [url, setUrl] = useState("/produits");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ sent: number; removed: number; total: number } | null>(null);

  async function submit() {
    setBusy(true);
    try {
      const res = await send({ data: { title, body, url } });
      setLast(res);
      toast.success(`Envoyé à ${res.sent}/${res.total} abonnés`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="font-display text-xl font-bold">Diffuser une notification push</h2>
        <p className="text-sm text-muted-foreground">Envoyée à tous les navigateurs abonnés (web push VAPID).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="push-title">Titre</Label>
        <Input id="push-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="push-body">Message</Label>
        <Textarea id="push-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={400} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="push-url">Lien à ouvrir (optionnel)</Label>
        <Input id="push-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/produits/mon-produit" />
      </div>
      <Button onClick={submit} disabled={busy} className="gap-2">
        <Send className="h-4 w-4" /> {busy ? "Envoi…" : "Envoyer à tous les abonnés"}
      </Button>
      {last && (
        <p className="text-sm text-muted-foreground">
          Dernier envoi : {last.sent} livrés, {last.removed} abonnements expirés supprimés, {last.total} total.
        </p>
      )}
    </div>
  );
}
