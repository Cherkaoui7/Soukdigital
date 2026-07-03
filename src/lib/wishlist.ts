import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Set(data.map((r) => r.product_id));
    },
  });

  const ids = query.data ?? new Set<string>();

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("auth-required");
      if (ids.has(productId)) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
        return { productId, added: false };
      }
      const { error } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return { productId, added: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist", user?.id] }),
  });

  return {
    ids,
    isLoading: query.isLoading,
    has: (id: string) => ids.has(id),
    toggle: (id: string) => toggle.mutate(id),
    isAuth: !!user,
  };
}
