// LGPD Art. 46 — AES-256-GCM decryption for CPF/CNPJ
// With IDOR protection and legacy Base64 blocking
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
  const { encrypted, entity_type, entity_id } = body ?? {};

  if (!encrypted) return Response.json({ error: "encrypted obrigatório" }, { status: 400 });

  // Verificar posse do dado antes de descriptografar
  if (entity_type && entity_id) {
    try {
      const entity = await base44.entities[entity_type]?.get(entity_id);
      if (!entity) return Response.json({ error: "Registro não encontrado" }, { status: 404 });

      const isOwner = entity.created_by === user.email || entity.user_id === user.id;
      if (!isOwner && user.role !== 'admin') {
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: user.email,
          action: "TENTATIVA_ACESSO_CPF_NAO_AUTORIZADO",
          entity_type,
          entity_id,
          details: JSON.stringify({ timestamp: new Date().toISOString() })
        }).catch(() => {});
        return Response.json({ error: "Acesso negado — dado não pertence a este usuário" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Erro ao verificar propriedade do dado" }, { status: 500 });
    }
  }

  // Bloquear formato Base64 legado (não é criptografia real)
  if (!encrypted.startsWith("aes256gcm.v1.")) {
    console.error("LGPD-CRITICAL: formato Base64 legado bloqueado para:", user.email);
    return Response.json({
      error: "Formato legado não suportado por razões de segurança. Recadastre o dado."
    }, { status: 400 });
  }

  const parts = encrypted.split(".");
  if (parts.length !== 4) return Response.json({ error: "Formato inválido" }, { status: 400 });

  try {
    const key = await getAESKey();
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(parts[2]) },
      key,
      b64ToBytes(parts[3])
    );
    const decrypted = new TextDecoder().decode(plain);

    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: "ACESSO_CPF_AUTORIZADO",
      entity_type: entity_type || "N/A",
      entity_id: entity_id || "N/A",
      details: "Descriptografia AES-256-GCM — LGPD Art.46 controlado"
    }).catch(() => {});

    return Response.json({ decrypted });
  } catch {
    return Response.json({ error: "Falha ao descriptografar dado" }, { status: 500 });
  }
});