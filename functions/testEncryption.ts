/**
 * Função de teste para validar a criptografia AES-256-GCM
 * REMOVER após confirmação — uso interno apenas
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function deriveKey() {
  const appId = Deno.env.get("BASE44_APP_ID") || "juris-default-key";
  const salt = "juris-lgpd-cpf-encryption-v1";
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(appId), { name: "HKDF" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: encoder.encode(salt), info: encoder.encode("cpf-cnpj-encryption") },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

Deno.serve(async (req) => {
  try {
    // Teste sem auth para validar o algoritmo
    const testCPF = "123.456.789-00";
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey();

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(testCPF));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    const encrypted = `aes256gcm.v1.${ivB64}.${ctB64}`;

    // Decrypt to verify round-trip
    function b64ToBytes(b64) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    const parts = encrypted.split(".");
    const ivDec = b64ToBytes(parts[2]);
    const ct = b64ToBytes(parts[3]);
    const key2 = await deriveKey();
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivDec }, key2, ct);
    const decrypted = new TextDecoder().decode(plain);

    return Response.json({
      test: "AES-256-GCM Encryption",
      original: testCPF,
      encrypted: encrypted,
      encrypted_length: encrypted.length,
      decrypted: decrypted,
      roundtrip_ok: decrypted === testCPF,
      is_base64_only: !encrypted.startsWith("aes256gcm"),
      algorithm: "AES-256-GCM with HKDF-SHA256 key derivation",
      iv_bytes: 12,
      key_bits: 256
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});