const useApi = () => {
  const client = useSupabaseClient();

  // Fungsi untuk mengambil data via Edge Function
  const fetchProducts = async () => {
    const { data, error } = await client.functions.invoke("products", {
      method: "GET",
    });
    if (error) throw error;

    return data;
  };

  // Fungsi untuk menambah data via Edge Function
  const addProduct = async (productData: any) => {
    const { data, error } = await client.functions.invoke("products", {
      method: "POST",
      body: productData,
    });
    if (error) throw error;
    return data;
  };

  // Fungsi untuk mengubah data via Edge Function
  const updateProduct = async (id: string, productData: any) => {
    const { data, error } = await client.functions.invoke(`products?id=${id}`, {
      method: "PUT",
      body: productData,
    });
    if (error) throw error;
    return data;
  };

  // Fungsi untuk menghapus data via Edge Function
  const deleteProduct = async (id: string) => {
    const { data, error } = await client.functions.invoke(`products?id=${id}`, {
      method: "DELETE",
    });
    if (error) throw error;
    return data;
  };

  return {
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
};

export default useApi;
