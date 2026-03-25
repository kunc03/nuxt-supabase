import { corsHeaders } from "../../_shared/cors.ts";

export const handleGet = async (
  req: Request,
  supabaseClient: any,
  id: string | null,
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
      const { data, error } = await supabaseClient
        .from("products")
        .select("*");

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
