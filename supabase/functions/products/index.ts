import { serve } from "std/http/server";
import { createClient } from "supabase";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGet } from "./handlers/get.ts";
import { handlePost } from "./handlers/post.ts";
import { handlePut } from "./handlers/put.ts";
import { handleDelete } from "./handlers/delete.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    let validAuthHeader: string | undefined = undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && token.split(".").length === 3) {
        validAuthHeader = authHeader;
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: validAuthHeader ? { Authorization: validAuthHeader } : {},
        },
      },
    );

    const method = req.method;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const q = url.searchParams.get("q"); // Ambil Query Pencarian

    switch (method) {
      case "GET":
        return await handleGet(req, supabaseClient, id, q);
      case "POST":
        return await handlePost(req, supabaseClient);
      case "PUT":
        return await handlePut(req, supabaseClient, id);
      case "DELETE":
        return await handleDelete(req, supabaseClient, id);
      default:
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
