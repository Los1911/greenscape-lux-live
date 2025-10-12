import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "resend";
import { landscaperWelcomeTemplate } from "../_shared/emailTemplates.ts";
import { serverConfig } from "../_shared/serverConfig.ts";

const ALLOW_ORIGINS = new Set(['https://greenscapelux.com', 'http://localhost:5173']);

function cors(origin?: string | null) {
  const allowed = origin && ALLOW_ORIGINS.has(origin) ? origin : 'https://greenscapelux.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

const resend = new Resend(serverConfig.resendApiKey);

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors(origin) });

  try {
    const { email, first_name, last_name } = await req.json();
    if (!email || !first_name || !last_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: cors(origin) });
    }

    const confirmationNumber = "GSL-PRO-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const emailResult = await resend.emails.send({
      from: "GreenScape Lux <noreply@greenscapelux.com>",
      to: [email],
      subject: "Welcome to GreenScape Lux — You're In!",
      html: landscaperWelcomeTemplate({ name: `${first_name} ${last_name}`, email, confirmationNumber })
    });

    if (emailResult.error) {
      console.error("Resend error:", emailResult.error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500, headers: cors(origin) });
    }

    return new Response(JSON.stringify({ message: "sent", confirmationNumber }), { status: 200, headers: cors(origin) });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors(origin) });
  }
});