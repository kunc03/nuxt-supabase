// deno-lint-ignore-file
import { corsHeaders } from "../../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
export const handlePost = async (req: Request, supabaseClient: any) => {
  const body = await req.json();

  let insertData: any;

  if (Array.isArray(body)) {
    // Bulk Insert
    insertData = body.map((item: any) => ({
      title: item.title,
      sub_title: item.sub_title,
      description: item.description,
      category: item.category,
      image_url: item.image_url,
      price: item.price !== undefined && item.price !== null ? Number(item.price) : undefined,
      stock: item.stock !== undefined && item.stock !== null ? Number(item.stock) : undefined,
      rate: item.rate !== undefined && item.rate !== null ? Number(item.rate) : undefined,
      images: Array.isArray(item.images) ? item.images : (item.images ? [item.images] : []),
    }));

    if (insertData.some((item: any) => !item.title)) {
      return new Response(
        JSON.stringify({ error: "Satu atau lebih item tidak memiliki Title" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
  } else {
    // Single Insert
    if (!body.title) {
      return new Response(
        JSON.stringify({ error: "Title wajib diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    insertData = {
      title: body.title,
      sub_title: body.sub_title,
      description: body.description,
      category: body.category,
      image_url: body.image_url,
      price: body.price !== undefined && body.price !== null ? Number(body.price) : undefined,
      stock: body.stock !== undefined && body.stock !== null ? Number(body.stock) : undefined,
      rate: body.rate !== undefined && body.rate !== null ? Number(body.rate) : undefined,
      images: body.images || [],
    };
  }

  const { data, error } = await supabaseClient
    .from("products")
    .insert(insertData)
    .select();

  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 201,
  });
};
