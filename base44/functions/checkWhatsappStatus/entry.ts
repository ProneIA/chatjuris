import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

  const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
    headers: { "apikey": EVOLUTION_API_KEY },
  });
  const data = await res.json();
  console.log("RAW Evolution API response:", JSON.stringify(data));
  return Response.json(data);
});