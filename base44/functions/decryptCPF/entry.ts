// LGPD Art. 46 — AES-256-GCM decryption for CPF/CNPJ
// Supports new format "aes256gcm.v1.*.*" and legacy Base64 for migration
// Deploy timestamp: 2026-02-19-v2
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getAESKey() {
  const appId = Deno.env.get("LGPD_ENCRYPTION_KEY") ?? Deno.env.get("BASE44_APP_ID");
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey("raw", enc.encode(appId), { name: "HKDF" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode("juris-cpf-v1"), info: enc.encode("aes-gcm-256") },
    raw, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { encrypted } = body ?? {};
  if (!encrypted) return Response.json({ error: "encrypted obrigatório" }, { status: 400 });

  let decrypted;
  if (encrypted.startsWith("aes256gcm.v1.")) {
    const parts = encrypted.split(".");
    if (parts.length !== 4) return Response.json({ error: "Formato inválido" }, { status: 400 });
    const key = await getAESKey();
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(parts[2]) }, key, b64ToBytes(parts[3]));
    decrypted = new TextDecoder().decode(plain);
  } else {
    // Legacy Base64 migration support
    console.warn("LGPD-WARN: legado Base64 — recriptografar urgente");
    const bin = atob(encrypted);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    decrypted = new TextDecoder().decode(bytes);
  }

  try {
    await base44.entities.AuditLog.create({ user_email: user.email, action: "Acesso CPF/CNPJ", details: "Descriptografia AES-256-GCM — acesso controlado (LGPD)" });
  } catch (_) {}

  return Response.json({ decrypted });
});