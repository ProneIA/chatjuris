import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    await fetch(`${EVOLUTION_API_URL}/instance/delete/${user.id}`, {
      method: "DELETE",
      headers: { "apikey": EVOLUTION_API_KEY },
    });

    const sessions = await base44.asServiceRole.entities.WhatsappSession.filter({ user_id: user.id });
    if (sessions && sessions.length > 0) {
      await base44.asServiceRole.entities.WhatsappSession.update(sessions[0].id, {
        status: "disconnected",
        session_token: null,
        connected_at: null,
        agent_enabled: false,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});