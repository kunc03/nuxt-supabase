import { corsHeaders } from "../../_shared/cors.ts";

export const handlePost = async (req: Request, supabaseClient: any) => {
  const body = await req.json();

  if (!body.title) {
    return new Response(
      JSON.stringify({ error: "Title wajib diisi" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  const insertData = {
    title: body.title,
    sub_title: body.sub_title,
    description: body.description,
    category: body.category,
    image_url: body.image_url,
    price: body.price !== undefined && body.price !== null ? Number(body.price) : undefined,
    stock: body.stock !== undefined && body.stock !== null ? Number(body.stock) : undefined,
    rate: body.rate !== undefined && body.rate !== null ? Number(body.rate) : undefined,
  };

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
