import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("WEBHOOK RECEBIDO:", JSON.stringify(body));
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("WEBHOOK ERRO:", error);
    return Response.json({ success: true }, { status: 200 });
  }
});