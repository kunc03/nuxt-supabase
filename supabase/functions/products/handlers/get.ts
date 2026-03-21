import { corsHeaders } from "../../_shared/cors.ts";

export const handleGet = async (req: Request, supabaseClient: any, id: string | null) => {
  console.log("--- Executing handleGet ---");
  console.log("ID Parameter:", id);

  if (id) {
    console.log("Fetching single product...");
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Fetch single result:", { data, error });
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } else {
    console.log("Fetching all products...");
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*");

      console.log("Fetch all result:", { data, error });
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (e: any) {
      console.error("Error inside fetch all:", e.message);
      throw e;
    }
  }
};
