import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function ProductImageUpload({
  value,
  onChange,
  slug,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  slug?: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image uniquement");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const base = (slug || "produit").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      const path = `${base}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, TEN_YEARS);
      if (sErr || !signed) throw sErr || new Error("URL signée indisponible");
      onChange(signed.signedUrl);
      toast.success("Image téléversée");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur d'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border">
            <img src={value} alt="Aperçu" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Retirer l'image"
              className="absolute right-0 top-0 rounded-bl-md bg-background/80 p-0.5 text-foreground hover:bg-background"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground">
            <UploadCloud className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {uploading ? "Téléversement…" : "Téléverser"}
          </Button>
          <Input
            placeholder="ou coller une URL"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      </div>
    </div>
  );
}
