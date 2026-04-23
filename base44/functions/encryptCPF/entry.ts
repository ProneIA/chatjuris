// LGPD Art. 46 — AES-256-GCM encryption for CPF/CNPJ
// Replaces Base64 (encoding only) with real cryptography
// Deploy timestamp: 2026-02-19-v2
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getAESKey() {
  const appId = Deno.env.get("LGPD_ENCRYPTION_KEY") ?? Deno.env.get("BASE44_APP_ID");
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey("raw", enc.encode(appId), { name: "HKDF" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode("juris-cpf-v1"), info: enc.encode("aes-gcm-256") },
    raw, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const cpf_cnpj = body?.cpf_cnpj;
  if (!cpf_cnpj) return Response.json({ error: "cpf_cnpj obrigatório" }, { status: 400 });

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getAESKey();
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(cpf_cnpj));

  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ct)));
  const encrypted = `aes256gcm.v1.${ivB64}.${ctB64}`;

  try {
    await base44.entities.AuditLog.create({ user_email: user.email, action: "Criptografia CPF/CNPJ", details: "AES-256-GCM — LGPD Art.46" });
  } catch (_) {}

  return Response.json({ encrypted });
});