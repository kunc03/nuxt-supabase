import { corsHeaders } from "../../_shared/cors.ts";

export const handleDelete = async (req: Request, supabaseClient: any, id: string | null) => {
  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID wajib diisi untuk delete" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  const { data, error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
};
