import { NextResponse } from "next/server";
import { Resend } from "resend";
import { dbGetCheckouts, dbUpsertCheckout, dbLogReminder } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

function parseItems(cart) {
  try { return JSON.parse(cart || "[]"); } catch { return []; }
}

function fmtEur(n) {
  return Number(n || 0).toFixed(2).replace(".", ",") + " €";
}

const SITE_URL = "https://cosy-corner.shop";

function resolveImage(src) {
  if (!src) return null;
  if (src.startsWith("data:")) return null;
  if (src.startsWith("http")) return src;
  return SITE_URL + (src.startsWith("/") ? src : "/" + src);
}

function buildEmail({ name, items, cart_total }) {
  const firstName = name?.split(" ")[0] || "";

  const itemsHtml = items.map(it => {
    const imgUrl = resolveImage(it.image);
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
      <tr>
        ${imgUrl ? `
        <td width="88" valign="top" style="padding-top:2px">
          <img src="${imgUrl}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;background:#f5f5f5;border-radius:4px" alt="${it.title || ""}" />
        </td>` : ""}
        <td style="${imgUrl ? "padding-left:16px;" : ""}vertical-align:middle">
          <p style="margin:0;font-size:13px;font-weight:700;color:#000;line-height:1.4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${it.title || it.name || "Article"}</p>
          ${it.variant ? `<p style="margin:4px 0 0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${it.variant}</p>` : ""}
          <p style="margin:8px 0 0;font-size:13px;font-weight:900;color:#000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${it.qty && it.qty > 1 ? `×${it.qty} · ` : ""}${fmtEur((it.price || 0) * (it.qty || 1))}</p>
        </td>
      </tr>
    </table>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Votre sélection vous attend</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff">

        <!-- Header logo -->
        <tr><td style="padding:28px 40px 22px;border-bottom:1px solid #f0f0f0">
          <p style="margin:0;font-size:16px;font-weight:900;letter-spacing:-0.5px;color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">SCREENLAB</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="padding:28px 40px 22px">
          <p style="margin:0 0 8px;font-size:9px;font-weight:700;letter-spacing:2px;color:#aaa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">Panier sauvegardé</p>
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:#000;letter-spacing:-0.5px;line-height:1.2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            ${firstName ? `${firstName}, votre<br>sélection vous attend.` : `Votre sélection<br>vous attend.`}
          </h1>
          <p style="margin:0;font-size:12px;color:#888;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            Les articles que vous avez choisis sont toujours disponibles. Les stocks étant limités, nous ne pouvons pas les réserver indéfiniment.
          </p>
        </td></tr>

        <!-- Séparateur -->
        <tr><td style="padding:0 48px"><div style="height:1px;background:#f0f0f0"></div></td></tr>

        <!-- Articles -->
        <tr><td style="padding:22px 40px">
          ${itemsHtml}
        </td></tr>

        <!-- Séparateur -->
        <tr><td style="padding:0 40px"><div style="height:1px;background:#f0f0f0"></div></td></tr>

        <!-- Total + CTA -->
        <tr><td style="padding:22px 40px">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr>
              <td style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">Total</td>
              <td align="right" style="font-size:18px;font-weight:900;color:#000;letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${fmtEur(cart_total)}</td>
            </tr>
          </table>
          <a href="${SITE_URL}" style="display:block;background:#000000;color:#ffffff;text-decoration:none;font-size:11px;font-weight:900;padding:14px 28px;text-align:center;letter-spacing:1.5px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            Récupérer mon panier
          </a>
        </td></tr>

        <!-- Réassurance -->
        <tr><td style="border-top:1px solid #f0f0f0;padding:16px 40px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" width="33%" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                <p style="margin:0;font-size:10px;font-weight:700;color:#222">Livraison gratuite</p>
              </td>
              <td align="center" width="33%" style="border-left:1px solid #f0f0f0;border-right:1px solid #f0f0f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                <p style="margin:0;font-size:10px;font-weight:700;color:#222">Paiement sécurisé</p>
              </td>
              <td align="center" width="33%" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                <p style="margin:0;font-size:10px;font-weight:700;color:#222">Retour 30 jours</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #f0f0f0;padding:16px 40px;text-align:center">
          <p style="margin:0;font-size:10px;color:#ccc;line-height:2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            SCREENLAB · cosy-corner.shop<br>
            <a href="#" style="color:#ccc;text-decoration:underline">Se désabonner</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

export async function POST(req, { params }) {
  try {
    const { rows: allCheckouts } = await dbGetCheckouts({ filter: "all", pageSize: 9999 });
    const cart = allCheckouts.find(c => String(c.id) === String(params.id));

    if (!cart) return NextResponse.json({ error: "Panier introuvable" }, { status: 404 });
    if (!cart.email) return NextResponse.json({ error: "Pas d'email pour ce panier" }, { status: 400 });

    const items = parseItems(cart.cart);

    const { error } = await resend.emails.send({
      from:    process.env.RESEND_FROM || "ScreenLab <relance@cosy-corner.shop>",
      to:      cart.email,
      subject: `${cart.name?.split(" ")[0] || "Hey"}, ton panier t'attend ! 🛒`,
      html:    buildEmail({ name: cart.name, items, cart_total: cart.cart_total }),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Marquer comme relancé dans Redis
    await dbUpsertCheckout({ ...cart, reminded_at: new Date().toISOString() });

    await dbLogReminder({
      checkout_id: params.id,
      email: cart.email,
      name: cart.name,
      cart_total: cart.cart_total,
      items_count: items.length,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
