/**
 * LGPD Art. 46 — Descriptografia AES-256-GCM de CPF/CNPJ
 * Suporta o novo formato "aes256gcm.v1.{iv}.{ct}" e o legado Base64 (migração gradual).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function deriveKey() {
  const appId = Deno.env.get("BASE44_APP_ID") || "juris-default-key";
  const salt = "juris-lgpd-cpf-encryption-v1";
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

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { encrypted } = await req.json();

    if (!encrypted) {
      return Response.json({ error: 'Dado criptografado é obrigatório' }, { status: 400 });
    }

    let decrypted;

    // Formato novo: aes256gcm.v1.{ivB64}.{ctB64}
    if (encrypted.startsWith("aes256gcm.v1.")) {
      const parts = encrypted.split(".");
      if (parts.length !== 4) {
        return Response.json({ error: 'Formato inválido' }, { status: 400 });
      }
      const iv = base64ToBytes(parts[2]);
      const ciphertext = base64ToBytes(parts[3]);
      const key = await deriveKey();

      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );
      decrypted = new TextDecoder().decode(plaintext);

    } else {
      // Formato legado Base64 — suporte temporário para migração
      // AVISO: dados legados devem ser re-criptografados via migração
      const binary = atob(encrypted);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      decrypted = new TextDecoder().decode(bytes);
      console.warn('LGPD-WARN: CPF/CNPJ em formato legado (Base64). Recriptografar urgente.');
    }

    // Log de auditoria — acesso a dado sensível
    try {
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action: 'Acesso a CPF/CNPJ',
        details: 'Descriptografia de dado sensível realizada (LGPD — acesso controlado)'
      });
    } catch (_e) {}

    return Response.json({ decrypted });

  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return Response.json({ error: 'Falha ao descriptografar dado' }, { status: 400 });
  }
});