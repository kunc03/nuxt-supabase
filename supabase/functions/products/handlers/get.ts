import { corsHeaders } from "../../_shared/cors.ts";

export const handleGet = async (
  req: Request,
  supabaseClient: any,
  id: string | null,
  q: string | null,
) => {
  if (id) {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } else {
    try {
      // Memastikan produk terbaru atau yang baru diupdate muncul paling atas
      let query = supabaseClient
        .from("products")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (q) {
        // Ganti tanda koma (jika ada) degan spasi agar tidak merusak logika pohon/tree .or() Postgrest
        const safeQ = q.replace(/,/g, " ");
        
        // Memadukan Pencarian Teks Penuh (plfts) dan pencarian parsial (ILIKE)
        query = query.or(`fts_vector.plfts.${safeQ},title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (e: any) {
      throw e;
    }
  }
};
