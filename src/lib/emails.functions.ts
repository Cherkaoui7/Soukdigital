import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const orderConfirmSchema = z.object({
  orderId: z.string().uuid(),
  to: z.string().email(),
  fullName: z.string().min(1).max(120),
  totalMad: z.number().nonnegative(),
  paymentMethod: z.enum(["cod", "card"]),
});

const shippedSchema = z.object({
  orderId: z.string().uuid(),
});

async function sendViaGateway(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) {
    return { ok: false as const, reason: "no_provider" as const };
  }
  // Configure a custom From address via the EMAIL_FROM secret, e.g.
  //   Souk Digital <hello@ton-domaine.ma>
  // The domain must be verified in Resend beforehand. Falls back to Resend's
  // shared onboarding sender when EMAIL_FROM is not set.
  const from = process.env.EMAIL_FROM || "Souk Digital <onboarding@resend.dev>";
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": apiKey,
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    return { ok: false as const, reason: "provider_error" as const, status: res.status };
  }
  return { ok: true as const };
}

function shell(inner: string) {
  return `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;background:#f8f5f0;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(43,47,160,.1)">
        ${inner}
      </div>
    </div>`;
}

/**
 * Sends an order confirmation email via Resend (through the Lovable gateway).
 * Silently no-ops if credentials are missing.
 */
export const sendOrderConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderConfirmSchema.parse(data))
  .handler(async ({ data }) => {
    const short = data.orderId.slice(0, 8).toUpperCase();
    const paymentLabel = data.paymentMethod === "cod" ? "Paiement à la livraison" : "Carte bancaire (CMI)";
    const total = new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(data.totalMad);

    const html = shell(`
      <div style="background:linear-gradient(135deg,#2b2fa0,#4b4fd8);padding:28px 32px;color:#fff">
        <p style="margin:0;font-size:12px;letter-spacing:.15em;text-transform:uppercase;opacity:.85">Souk Digital</p>
        <h1 style="margin:6px 0 0;font-size:28px">Merci pour ta commande, ${escapeHtml(data.fullName)} !</h1>
      </div>
      <div style="padding:28px 32px;color:#1c1c2b">
        <p style="margin:0 0 12px">Ta commande <strong>#${short}</strong> est bien enregistrée.</p>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6b7280">Total</td><td style="padding:6px 0;text-align:right;font-weight:700">${total}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Paiement</td><td style="padding:6px 0;text-align:right">${paymentLabel}</td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280">On t'écrit dès qu'elle part chez le livreur Amana.</p>
      </div>`);

    return sendViaGateway({
      to: data.to,
      subject: `Souk Digital · Confirmation de commande #${short}`,
      html,
    });
  });

/**
 * Sends a shipping notification with the Amana tracking number.
 * Admin-only: requires authenticated caller with the `admin` role.
 * Resolves recipient email via the service-role client.
 */
export const sendShippingNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => shippedSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Authorize the caller
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return { ok: false as const, reason: "forbidden" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, full_name, tracking_number, tracking_carrier")
      .eq("id", data.orderId)
      .single();
    if (orderErr || !order || !order.tracking_number || !order.user_id) {
      return { ok: false as const, reason: "order_missing" as const };
    }

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const to = userRes?.user?.email;
    if (userErr || !to) {
      return { ok: false as const, reason: "no_recipient" as const };
    }

    const short = order.id.slice(0, 8).toUpperCase();
    const tracking = escapeHtml(order.tracking_number);
    const carrier = escapeHtml(order.tracking_carrier || "Amana");
    const fullName = escapeHtml(order.full_name || "Client");

    const html = shell(`
      <div style="background:linear-gradient(135deg,#c8553d,#e07a5f);padding:28px 32px;color:#fff">
        <p style="margin:0;font-size:12px;letter-spacing:.15em;text-transform:uppercase;opacity:.9">Souk Digital · Expédition</p>
        <h1 style="margin:6px 0 0;font-size:26px">Ta commande #${short} est en route ! 🐪</h1>
      </div>
      <div style="padding:28px 32px;color:#1c1c2b">
        <p style="margin:0 0 12px">Salam ${fullName}, ton colis a été confié à <strong>${carrier}</strong>.</p>
        <div style="margin:20px 0;padding:16px;border-radius:14px;background:#f4f1ea;border:1px dashed #c8553d">
          <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280">Numéro de suivi</p>
          <p style="margin:6px 0 0;font-family:'SF Mono',Menlo,monospace;font-size:20px;font-weight:700;color:#2b2fa0">${tracking}</p>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280">Retrouve le suivi dans ton espace « Mon compte » sur Souk Digital.</p>
      </div>`);

    return sendViaGateway({
      to,
      subject: `Souk Digital · Ta commande #${short} est en route`,
      html,
    });
  });

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
