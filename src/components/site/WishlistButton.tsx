import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
  variant = "icon",
}: {
  productId: string;
  className?: string;
  variant?: "icon" | "pill";
}) {
  const { has, toggle, isAuth } = useWishlist();
  const { t } = useI18n();
  const navigate = useNavigate();
  const active = has(productId);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) {
      navigate({ to: "/auth" });
      return;
    }
    toggle(productId);
  }

  if (variant === "pill") {
    return (
      <button
        onClick={onClick}
        aria-pressed={active}
        aria-label={t("wishlist.toggle")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors",
          active
            ? "border-secondary bg-secondary text-secondary-foreground"
            : "border-border bg-card text-foreground hover:border-secondary hover:text-secondary",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", active && "fill-current")} />
        {active ? t("wishlist.saved") : t("wishlist.save")}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={t("wishlist.toggle")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/95 backdrop-blur transition-colors",
        active ? "text-secondary" : "text-muted-foreground hover:text-secondary",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
}
