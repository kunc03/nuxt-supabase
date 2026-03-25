import { serve } from "std/http/server";
import { createClient } from "supabase";
import { corsHeaders } from "../_shared/cors.ts";

// Mencegah Deno Linting Error tentang global object Supabase yang di-inject otomati
declare const Supabase: any;

/**
 * Supabase AI Session:
 * Memanggil Model Embedding bawaan Deno Edge Functions (gte-small)
 */
const session = new Supabase.ai.Session('gte-small');

serve(async (req: Request) => {
  // 1. Handle CORS untuk preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      action, // 'embed_product' atau 'search'
      id,     // untuk menyimpan embedding ke produk tertentu
      query,  // kalimat pencarian (e.g., "sepatu olahraga")
      text    // teks yang akan di-embed (e.g., gabungan title & desc)
    } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ==========================================
    // AKSI 1: GENERATE & SIMPAN EMBEDDING PRODUK
    // ==========================================
    if (action === 'embed_product') {
      if (!id || !text) throw new Error("ID dan Teks dibutuhkan untuk membuat embedding produk.");
      
      // Mengubah teks produk menjadi Vector 384-dimensi
      const embedding = await session.run(text, {
        mean_pool: true,
        normalize: true,
      });

      // Simpan Vector tersebut ke kolom 'embedding' di tabel products
      const { error } = await supabaseClient
        .from('products')
        .update({ embedding: Array.from(embedding) })
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ message: "Produk berhasil di-embed!", embeddingLength: embedding.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ==========================================
    // AKSI 2: PENCARIAN CERDAS (SEMANTIC SEARCH)
    // ==========================================
    if (action === 'search') {
      if (!query) throw new Error("Query pencarian tidak boleh kosong.");
      
      // Mengubah kalimat query user menjadi Vector
      const queryEmbedding = await session.run(query, {
        mean_pool: true,
        normalize: true,
      });

      // Memanggil fungsi RPC 'match_products_by_embedding'
      // dengan threshold 0.81 (tingkat kemiripan tinggi/ketat untuk bahasa Inggris)
      const { data, error } = await supabaseClient.rpc('match_products_by_embedding', {
        query_embedding: Array.from(queryEmbedding),
        match_threshold: 0.81,
        match_count: 10
      });

      if (error) throw error;

      return new Response(JSON.stringify({ results: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Action tidak valid. Gunakan 'embed_product' atau 'search'.");

  } catch (error: any) {
    console.error("AI Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
