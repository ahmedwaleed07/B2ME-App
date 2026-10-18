import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function secretKey(): string {
  const direct = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (direct) return direct;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) throw new Error("Supabase secret API key is not configured");
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);
  const key = entries.map((entry: any) => typeof entry === "string" ? entry : entry?.api_key ?? entry?.key)
    .find((value: unknown) => typeof value === "string" && value.startsWith("sb_secret_"));
  if (!key) throw new Error("No Supabase secret API key is available");
  return key;
}

const baseUrl = () => (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const key = () => secretKey();

async function api(path: string, init: RequestInit = {}, bearer?: string) {
  const headers = new Headers(init.headers);
  headers.set("apikey", key());
  headers.set("Authorization", `Bearer ${bearer || key()}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${baseUrl()}${path}`, { ...init, headers });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { message: text.slice(0, 300) }; }
  if (!res.ok) throw new Error(body?.msg || body?.message || body?.error_description || body?.error || `Supabase request failed (${res.status})`);
  return body;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  let createdUserId = "";
  let createdCompanyId = "";
  try {
    const url = baseUrl();
    if (!url) throw new Error("Supabase URL is not configured");
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return response({ error: "Sign in as a B2ME administrator" }, 401);

    // Resolve the JWT server-side, then authorize using immutable app_metadata.
    const caller = await api("/auth/v1/user", { method: "GET" }, token);
    if (caller?.app_metadata?.b2me_admin !== true) return response({ error: "Administrator access required" }, 403);

    const input = await req.json().catch(() => ({}));
    const applicationId = typeof input.application_id === "string" ? input.application_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) {
      return response({ error: "Invalid application id" }, 400);
    }

    const rows = await api(`/rest/v1/provider_applications?id=eq.${encodeURIComponent(applicationId)}&select=*`);
    const application = rows?.[0];
    if (!application) return response({ error: "Application not found" }, 404);
    if (application.status !== "pending") return response({ error: "This application has already been reviewed" }, 409);

    const email = normalizeEmail(application.email);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Application email is invalid");
    const origin = req.headers.get("Origin") || "";
    let redirect = typeof input.redirect_to === "string" ? input.redirect_to : "";
    let redirectUrl: URL;
    try { redirectUrl = new URL(redirect); } catch { return response({ error: "Invalid provider dashboard redirect" }, 400); }
    if (redirectUrl.origin !== origin || !redirectUrl.pathname.endsWith("/provider-dashboard.html") ||
      redirectUrl.search || redirectUrl.hash || redirectUrl.username || redirectUrl.password ||
      (redirectUrl.protocol !== "https:" && redirectUrl.hostname !== "localhost")) {
      return response({ error: "Invite redirect must point to this site's provider dashboard" }, 400);
    }
    const invitePath = "/auth/v1/invite" + (redirect ? `?redirect_to=${encodeURIComponent(redirect)}` : "");

    const invited = await api(invitePath, {
      method: "POST",
      body: JSON.stringify({
        email,
        data: { full_name: application.full_name, b2me_provider: true },
      }),
    });
    createdUserId = invited?.id || invited?.user?.id || "";
    if (!createdUserId) throw new Error("Supabase did not return the invited account");

    const isCompany = Boolean(String(application.company_name || "").trim());
    const slugBase = String(application.company_name || application.full_name || "provider")
      .toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "provider";
    const companyRows = await api("/rest/v1/companies?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        owner_id: createdUserId,
        provider_type: isCompany ? "company" : "freelancer",
        slug: `b2me-${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
        name_ar: String(application.company_name || application.full_name).trim().slice(0, 200),
        contact_name: String(application.full_name || "").trim().slice(0, 200),
        public_email: email,
        public_phone: String(application.phone || "").trim().slice(0, 80) || null,
        website: String(application.website || "").trim().slice(0, 500) || null,
        social_links: application.social_links && typeof application.social_links === "object" ? application.social_links : {},
        job_title: String(application.job_title || "").trim().slice(0, 200) || null,
        status: "pending",
      }),
    });
    createdCompanyId = companyRows?.[0]?.id || "";
    if (!createdCompanyId) throw new Error("Could not create the provider's pending workspace");

    const reviewed = await api(`/rest/v1/provider_applications?id=eq.${encodeURIComponent(applicationId)}&status=eq.pending`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: caller.id }),
    });
    if (!reviewed?.length) throw new Error("Application was reviewed by another admin; retry after refreshing");

    return response({ ok: true, email, company_id: createdCompanyId });
  } catch (error) {
    // Roll back only resources created by this invocation so a failed invite stays retryable.
    try { if (createdCompanyId) await api(`/rest/v1/companies?id=eq.${encodeURIComponent(createdCompanyId)}`, { method: "DELETE" }); } catch { /* best effort */ }
    try { if (createdUserId) await api(`/auth/v1/admin/users/${encodeURIComponent(createdUserId)}`, { method: "DELETE" }); } catch { /* best effort */ }
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /already been registered|already exists|already been invited/i.test(message) ? 409 : 400;
    return response({ error: message }, status);
  }
});
