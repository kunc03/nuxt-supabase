const useApi = () => {
  const client = useSupabaseClient();

  // Fungsi untuk mengambil data via Edge Function (Mendukung Search)
  const fetchProducts = async (search?: string) => {
    const path = search ? `products?q=${encodeURIComponent(search)}` : "products";
    const { data, error } = await client.functions.invoke(path, {
      method: "GET",
    });
    if (error) throw error;

    return data;
  };

  // Fungsi untuk mengambil data satu produk via Edge Function
  const fetchProduct = async (id: string) => {
    const { data, error } = await client.functions.invoke(`products?id=${id}`, {
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

  // Fungsi untuk menghapus data via Edge Function (Mendukung Bulk Delete)
  const deleteProduct = async (id: string | string[]) => {
    const idsParam = Array.isArray(id) ? id.join(",") : id;
    const { data, error } = await client.functions.invoke(`products?id=${idsParam}`, {
      method: "DELETE",
    });
    if (error) throw error;
    return data;
  };

  return {
    fetchProducts,
    fetchProduct,
    addProduct,
    updateProduct,
    deleteProduct,
  };
};

export default useApi;
