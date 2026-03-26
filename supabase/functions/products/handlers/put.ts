// deno-lint-ignore-file
import { corsHeaders } from "../../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
export const handlePut = async (req: Request, supabaseClient: any, id: string | null, aiSession: any) => {
  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID wajib diisi untuk update" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  const body = await req.json();
  const updateData: any = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.sub_title !== undefined) updateData.sub_title = body.sub_title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.image_url !== undefined) updateData.image_url = body.image_url;
  if (body.price !== undefined && body.price !== null) updateData.price = Number(body.price);
  if (body.stock !== undefined && body.stock !== null) updateData.stock = Number(body.stock);
  if (body.rate !== undefined && body.rate !== null) updateData.rate = Number(body.rate);
  if (body.images !== undefined) updateData.images = body.images;

  // Generate embedding jika title atau description berubah
  if (body.title !== undefined || body.description !== undefined) {
    // Ambil data lama jika salah satu kosong di body untuk melengkapi context embedding
    let t = body.title;
    let d = body.description;

    if (t === undefined || d === undefined) {
      const { data: oldProduct } = await supabaseClient.from('products').select('title, description').eq('id', id).single();
      if (oldProduct) {
        t = t ?? oldProduct.title;
        d = d ?? oldProduct.description;
      }
    }

    const textToEmbed = `${t} ${d || ''}`;
    const embedding = await aiSession.run(textToEmbed, {
      mean_pool: true,
      normalize: true,
    });
    updateData.embedding = Array.from(embedding);
  }

  const { data, error } = await supabaseClient
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
};
