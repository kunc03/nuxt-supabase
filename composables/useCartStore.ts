import { defineStore } from "pinia";
import { ref } from "vue";
import { useSupabaseClient, useSupabaseUser } from "#imports";

export const useCartStore = defineStore("cart", () => {
  const client = useSupabaseClient<any>();
  const user = useSupabaseUser();

  // Full items for cart page
  const cartItems = ref<any[]>([]);
  // Just product IDs for quick checks on listing/cards
  const cartProductIds = ref<number[]>([]);
  const pending = ref<boolean>(false);

  const clearCart = () => {
    cartItems.value = [];
    cartProductIds.value = [];
  };

  const fetchCartItems = async () => {
    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      clearCart();
      return;
    }

    pending.value = true;
    try {
      const { data, error } = await client
        .from("carts")
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            title,
            price,
            image_url,
            images
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        cartItems.value = data;
        cartProductIds.value = data.map((item: any) => item.product_id);
      }
    } catch (e) {
      console.error("Error fetching full cart items:", e);
    } finally {
      pending.value = false;
    }
  };

  const fetchCartProductIds = async () => {
    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      clearCart();
      return;
    }

    try {
      const { data, error } = await client
        .from("carts")
        .select("product_id")
        .eq("user_id", userId);

      if (!error && data) {
        cartProductIds.value = data.map((d: any) => d.product_id);
      }
    } catch (e) {
      console.error("Error fetching cart product IDs:", e);
    }
  };

  const addToCart = async (productId: number) => {
    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id || user.value?.id;
    if (!userId) return false;

    // Optimistic UI update for quick status check
    if (!cartProductIds.value.includes(productId)) {
      cartProductIds.value.push(productId);
    }

    try {
      const { data: existingCart, error: fetchError } = await client
        .from("carts")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingCart) {
        const { error: updateError } = await client
          .from("carts")
          .update({
            quantity: existingCart.quantity + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCart.id);
        if (updateError) throw updateError;

        // update full cart item locally if it is loaded
        const item = cartItems.value.find((i: any) => i.id === existingCart.id);
        if (item) item.quantity += 1;
      } else {
        const { error: insertError } = await client
          .from("carts")
          .insert({
            user_id: userId,
            product_id: productId,
            quantity: 1,
          });
        if (insertError) throw insertError;
      }
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    }
  };

  const updateQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) return false;

    try {
      const { error } = await client
        .from("carts")
        .update({ quantity: newQuantity })
        .eq("id", cartId);
      if (error) throw error;

      const item = cartItems.value.find((i: any) => i.id === cartId);
      if (item) item.quantity = newQuantity;
      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  };

  const removeFromCart = async (cartId: string) => {
    try {
      const { error } = await client.from("carts").delete().eq("id", cartId);
      if (error) throw error;

      // Update local state
      const removedItem = cartItems.value.find((i: any) => i.id === cartId);
      cartItems.value = cartItems.value.filter((item: any) =>
        item.id !== cartId
      );

      if (removedItem) {
        cartProductIds.value = cartProductIds.value.filter((id: number) =>
          id !== removedItem.product_id
        );
      }
      return true;
    } catch (error) {
      console.error("Error removing item:", error);
      return false;
    }
  };

  const isInCart = (productId: number) => {
    return cartProductIds.value.includes(productId);
  };

  const checkoutCart = async () => {
    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id || user.value?.id;
    if (!userId) return false;

    try {
      const { error } = await client.from("carts").delete().eq("user_id", userId);
      if (error) throw error;
      
      clearCart();
      return true;
    } catch (error) {
      console.error("Error during checkout:", error);
      return false;
    }
  };

  return {
    cartItems,
    cartProductIds,
    pending,
    fetchCartItems,
    fetchCartProductIds,
    addToCart,
    updateQuantity,
    removeFromCart,
    isInCart,
    clearCart,
    checkoutCart,
  };
}, {
  persist: true,
});
