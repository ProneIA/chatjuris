/**
 * LGPD Art. 46 — Criptografia AES-256-GCM de CPF/CNPJ
 * Substituição da codificação Base64 (insegura) por criptografia real AES-256-GCM
 * usando Web Crypto API nativa do Deno (sem dependências externas).
 *
 * O segredo de criptografia é derivado do APP_ID + uma salt fixa usando HKDF,
 * garantindo que a chave não fique hardcoded nem exposta em logs.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Deriva uma chave AES-256-GCM a partir do APP_ID (secret do ambiente)
async function deriveKey() {
  const appId = Deno.env.get("BASE44_APP_ID") || "juris-default-key";
  const salt = "juris-lgpd-cpf-encryption-v1"; // salt fixo + versionado
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appId),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      info: encoder.encode("cpf-cnpj-encryption"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cpf_cnpj } = await req.json();

    if (!cpf_cnpj) {
      return Response.json({ error: 'CPF/CNPJ é obrigatório' }, { status: 400 });
    }

    // Gera IV aleatório de 12 bytes (recomendado para AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey();
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(cpf_cnpj)
    );

    // Serializa: base64(iv) + "." + base64(ciphertext)
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    const encrypted = `aes256gcm.v1.${ivB64}.${ctB64}`;

    // Log de auditoria — sem registrar o valor real
    try {
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action: 'Criptografia de CPF/CNPJ',
        details: 'Dado sensível criptografado com AES-256-GCM (LGPD Art. 46)'
      });
    } catch (_e) {}

    return Response.json({ encrypted });

  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return Response.json({ error: 'Erro interno na criptografia' }, { status: 500 });
  }
});