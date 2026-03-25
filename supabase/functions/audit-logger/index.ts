import { serve } from "std/http/server";
import { createClient } from "supabase";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Inisialisasi Supabase Client dengan Service Role Key
    // Kita gunakan Service Role agar aman dari blokir RLS sistem audit.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 2. Baca Payload Webhook dari Supabase
    // Format JSON otomatis dari Database Webhooks Supabase:
    // { type: 'INSERT|UPDATE|DELETE', table: '...', record: {...}, old_record: {...} }
    const payload = await req.json();

    const { type, table, record, old_record } = payload;

    // 3. Catat ke tabel audit_logs
    const { error } = await supabaseClient
      .from("audit_logs")
      .insert({
        table_name: table,
        action: type,
        new_record: record || null,
        old_record: old_record || null,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Audit Log Berhasil Dicatat" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
