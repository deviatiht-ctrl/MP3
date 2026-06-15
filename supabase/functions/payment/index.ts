// supabase/functions/payment/index.ts
// MP3 - PLOP PLOP Payment & Withdrawal Edge Function
// Deploy: supabase functions deploy payment
// Secrets: PLOP_CLIENT_ID, PLOP_CLIENT_SECRET (supabase secrets set ...)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLOP_BASE = "https://plopplop.solutionip.app";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Resilient PLOP PLOP authenticator ───────────────────────────────────
async function plopAuth(
  clientId: string,
  clientSecret: string,
): Promise<{ ok: boolean; token: string; message: string; debug?: string }> {
  let raw = "";
  try {
    const res = await fetch(`${PLOP_BASE}/api/auth/marchand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    raw = await res.text();
    let d: Record<string, unknown>;
    try { d = JSON.parse(raw); }
    catch { return { ok: false, token: "", message: "Auth repons non-JSON", debug: raw.slice(0, 200) }; }

    // Accept any truthy ok signal (true, 1, "true", "1")
    const ok = !!(d.success || d.status || d.statut);

    // Try all known token field paths; strip accidental "Bearer " prefix
    const inner = (d.data ?? {}) as Record<string, unknown>;
    const rawTok = (
      d.marchand_login_jwt || d.token || d.access_token || d.bearer || d.jwt ||
      inner.marchand_login_jwt || inner.token || inner.access_token || inner.bearer || inner.jwt || ""
    ) as string;
    const token = String(rawTok).replace(/^bearer\s+/i, "").trim();

    if (!ok || !token) {
      return { ok: false, token: "", message: (d.message as string) ?? "Auth echwe", debug: raw.slice(0, 300) };
    }
    return { ok: true, token, message: "" };
  } catch (err) {
    return { ok: false, token: "", message: "Auth rezo erè: " + (err as Error).message, debug: raw.slice(0, 200) };
  }
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const PLOP_CLIENT_ID = Deno.env.get("PLOP_CLIENT_ID") ?? "";
  const PLOP_CLIENT_SECRET = Deno.env.get("PLOP_CLIENT_SECRET") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!PLOP_CLIENT_ID || !PLOP_CLIENT_SECRET) {
    return json({ success: false, message: "PLOP credentials non configurés" }, 503);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Corps JSON invalide" }, 400);
  }

  const { action } = body as { action: string };

  // ── CREATE PAYMENT ────────────────────────────────────────────────────────
  if (action === "create_payment") {
    const { donation_id, amount, method } = body as {
      donation_id: string;
      amount: number;
      method: string;
    };

    if (!donation_id || !amount || !method) {
      return json({ success: false, message: "Paramètres manquants" }, 400);
    }

    const validMethods = ["moncash", "natcash", "kashpaw", "all"];
    if (!validMethods.includes(method)) {
      return json({ success: false, message: "Méthode invalide" }, 400);
    }

    if (amount < 20) {
      return json({ success: false, message: "Montant minimum 20 HTG" }, 400);
    }

    const refference_id = `DON-${Date.now()}-${
      Math.random().toString(36).substring(2, 7).toUpperCase()
    }`;

    let plopData: Record<string, unknown>;
    try {
      const plopRes = await fetch(`${PLOP_BASE}/api/paiement-marchand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: PLOP_CLIENT_ID,
          refference_id,
          montant: amount,
          payment_method: method,
        }),
      });
      plopData = await plopRes.json();
    } catch (err) {
      return json({ success: false, message: "Erreur API PLOP PLOP: " + (err as Error).message }, 502);
    }

    if (!plopData.status) {
      return json({ success: false, message: plopData.message ?? "Erreur PLOP PLOP" }, 400);
    }

    const { error: txnError } = await supabase
      .from("mp3_plop_transactions")
      .insert({
        donation_id,
        plop_reference_id: refference_id,
        plop_transaction_id: plopData.transaction_id ?? null,
        amount,
        method,
        redirect_url: plopData.url ?? null,
        status: "pending",
      });

    if (txnError) {
      return json({ success: false, message: "DB error: " + txnError.message }, 500);
    }

    return json({
      success: true,
      redirect_url: plopData.url,
      reference_id: refference_id,
      transaction_id: plopData.transaction_id,
    });
  }

  // ── VERIFY PAYMENT ────────────────────────────────────────────────────────
  if (action === "verify_payment") {
    const { reference_id } = body as { reference_id: string };

    if (!reference_id) {
      return json({ success: false, message: "reference_id manquant" }, 400);
    }

    let plopData: Record<string, unknown>;
    try {
      const plopRes = await fetch(`${PLOP_BASE}/api/paiement-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: PLOP_CLIENT_ID,
          refference_id: reference_id,
        }),
      });
      plopData = await plopRes.json();
    } catch (err) {
      return json({ success: false, message: "Erreur API PLOP PLOP: " + (err as Error).message }, 502);
    }

    const isConfirmed = plopData.status === true && plopData.trans_status === "ok";
    const dbStatus = isConfirmed ? "confirmed" : (plopData.status === false ? "failed" : "pending");

    const { data: txn } = await supabase
      .from("mp3_plop_transactions")
      .update({
        status: dbStatus,
        plop_transaction_id: (plopData.id_transaction as string) ?? null,
        verified_at: isConfirmed ? new Date().toISOString() : null,
      })
      .eq("plop_reference_id", reference_id)
      .select("donation_id")
      .single();

    if (txn?.donation_id) {
      await supabase
        .from("mp3_donations")
        .update({ status: dbStatus })
        .eq("id", txn.donation_id);
    }

    return json({
      success: true,
      is_confirmed: isConfirmed,
      trans_status: plopData.trans_status,
      method: plopData.method,
      montant: plopData.montant,
    });
  }

  // ── GET REAL PLOP PLOP BALANCE ────────────────────────────────────────────
  if (action === "get_balance") {
    const auth = await plopAuth(PLOP_CLIENT_ID, PLOP_CLIENT_SECRET);
    if (!auth.ok) return json({ success: false, message: auth.message }, 401);

    // Try common balance endpoint patterns
    const balEndpoints = [
      { url: `${PLOP_BASE}/api/marchand/solde`,   method: "GET",  body: null },
      { url: `${PLOP_BASE}/api/marchand/balance`, method: "POST", body: JSON.stringify({ client_id: PLOP_CLIENT_ID }) },
      { url: `${PLOP_BASE}/api/marchand/account`, method: "GET",  body: null },
      { url: `${PLOP_BASE}/api/marchand/info`,    method: "GET",  body: null },
    ];

    for (const ep of balEndpoints) {
      try {
        const r = await fetch(ep.url, {
          method: ep.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          ...(ep.body ? { body: ep.body } : {}),
        });
        if (!r.ok) continue;
        const d = await r.json() as Record<string, unknown>;
        const ok = d.success === true || d.status === true || d.statut === true;
        if (!ok) continue;
        const inner = (d.data ?? d) as Record<string, unknown>;
        const balance =
          inner.balance ?? inner.solde ?? inner.montant ??
          inner.available ?? inner.disponible ?? d.balance ?? d.solde;
        if (balance !== undefined) {
          return json({ success: true, balance: Number(balance), endpoint: ep.url });
        }
      } catch { continue; }
    }

    return json({ success: false, message: "Endpoint balans PLOP PLOP pa jwenn" }, 404);
  }

  // ── WITHDRAW (Admin) ──────────────────────────────────────────────────────
  if (action === "withdraw") {
    const { amount, method, recipient, reference } = body as {
      amount: number;
      method: string;
      recipient: string;
      reference: string;
    };

    if (!amount || !method || !recipient || !reference) {
      return json({ success: false, message: "Paramètres manquants" }, 400);
    }

    // Guard: verify secrets are configured
    if (!PLOP_CLIENT_ID || !PLOP_CLIENT_SECRET) {
      return json({ success: false, message: "Secrets PLOP_CLIENT_ID / PLOP_CLIENT_SECRET pa konfigire nan Supabase" }, 500);
    }

    // Step 1: Authenticate
    const authW = await plopAuth(PLOP_CLIENT_ID, PLOP_CLIENT_SECRET);
    if (!authW.ok) {
      return json({ success: false, message: "[Etap 1 Auth] " + authW.message, debug: authW.debug }, 401);
    }
    const marchand_token = authW.token;
    const timestamp = Math.floor(Date.now() / 1000);

    // Step 2: Generate withdrawal token with HMAC-SHA256
    const sigPayload = [amount, method, recipient, reference, timestamp].join("|");
    const withdrawal_signature = await hmacSha256(sigPayload, PLOP_CLIENT_SECRET);

    let tokenData: Record<string, unknown>;
    try {
      const tokenRes = await fetch(
        `${PLOP_BASE}/api/auth/marchand/withdrawal-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${marchand_token}`,
          },
          body: JSON.stringify({
            amount,
            method,
            recipient,
            reference,
            timestamp,
            withdrawal_signature,
          }),
        },
      );
      tokenData = await tokenRes.json();
    } catch (err) {
      return json({ success: false, message: "Token error: " + (err as Error).message }, 502);
    }

    const tokenOk = !!(tokenData.success || tokenData.status || tokenData.statut);
    if (!tokenOk) {
      return json({
        success: false,
        message: "[Etap 2 Token] " + (tokenData.message ?? "Token echwe"),
        error_code: tokenData.error_code,
        debug: JSON.stringify(tokenData).slice(0, 300),
        token_sent: {
          length: marchand_token.length,
          preview: marchand_token.slice(0, 50),
          is_jwt: marchand_token.startsWith("eyJ"),
        },
      }, 400);
    }

    const tInner = (tokenData.data ?? {}) as Record<string, unknown>;
    const rawWTok = (
      tokenData.withdrawal_token || tokenData.token || tokenData.access_token ||
      tInner.withdrawal_token || tInner.token || tInner.access_token || ""
    ) as string;
    const withdrawal_token = String(rawWTok).replace(/^bearer\s+/i, "").trim();
    if (!withdrawal_token) {
      return json({ success: false, message: "Withdrawal token vide", debug: JSON.stringify(tokenData).slice(0, 300) }, 502);
    }

    // Step 3: Execute withdrawal
    let withdrawData: Record<string, unknown>;
    try {
      const withdrawRes = await fetch(`${PLOP_BASE}/api/withdraw/marchand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${withdrawal_token}`,
        },
        body: JSON.stringify({ amount, method, recipient, reference }),
      });
      withdrawData = await withdrawRes.json();
    } catch (err) {
      return json({ success: false, message: "Withdraw error: " + (err as Error).message }, 502);
    }

    const wData = withdrawData.data as Record<string, unknown> | undefined;

    await supabase.from("mp3_plop_withdrawals").insert({
      amount,
      fee: wData?.fee ?? null,
      total: wData?.total ?? null,
      method,
      recipient,
      reference,
      plop_transaction_id: wData?.transaction_id ?? null,
      api_reference: wData?.api_reference ?? null,
      status: withdrawData.success ? "success" : "failed",
      balance_before: wData?.balance_before ?? null,
      balance_after: wData?.balance_after ?? null,
    });

    return json({
      success: withdrawData.success,
      message: withdrawData.message,
      data: withdrawData.data,
      error_code: withdrawData.error_code,
    });
  }

  // ── VERIFY WITHDRAWAL ─────────────────────────────────────────────────────
  if (action === "verify_withdraw") {
    const { reference } = body as { reference: string };

    if (!reference) {
      return json({ success: false, message: "reference manquant" }, 400);
    }

    const authV = await plopAuth(PLOP_CLIENT_ID, PLOP_CLIENT_SECRET);
    if (!authV.ok) {
      return json({ success: false, message: authV.message }, 401);
    }

    let verifyData: Record<string, unknown>;
    try {
      const verifyRes = await fetch(
        `${PLOP_BASE}/api/withdraw/marchand/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authV.token}`,
          },
          body: JSON.stringify({ reference }),
        },
      );
      verifyData = await verifyRes.json();
    } catch (err) {
      return json({ success: false, message: "Verify error: " + (err as Error).message }, 502);
    }

    if (verifyData.success && verifyData.data) {
      const vData = verifyData.data as Record<string, unknown>;
      await supabase
        .from("mp3_plop_withdrawals")
        .update({ status: vData.status ?? "pending" })
        .eq("reference", reference);
    }

    return json(verifyData);
  }

  return json({ success: false, message: "Action invalide" }, 400);
});
