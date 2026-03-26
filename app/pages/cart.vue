<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore } from '~/../composables/useCartStore'

// SEO Meta
useSeoMeta({
  title: 'Keranjang Belanja | Premium Catalog',
  ogTitle: 'Keranjang Belanja | Premium Catalog',
  description: 'Selesaikan pesanan Anda dengan aman dan cepat.',
})

const store = useCartStore()
const { cartItems, pending } = storeToRefs(store)
const { fetchCartItems, removeFromCart, updateQuantity, checkoutCart } = store

onMounted(() => {
  fetchCartItems()
})


const showConfirmModal = ref(false)
const itemToDelete = ref(null)
const isDeleting = ref(false)

const showSuccess = ref(false)
const isCheckingOut = ref(false)

const openConfirmModal = (cartId) => {
  itemToDelete.value = cartId
  showConfirmModal.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  await removeFromCart(itemToDelete.value)
  isDeleting.value = false
  showConfirmModal.value = false
  itemToDelete.value = null
}

const updateItemQuantity = async (cartId, newQuantity) => {
  await updateQuantity(cartId, newQuantity)
}

const totalPrice = computed(() => {
  return (cartItems.value || []).reduce((total, item) => {
    const price = item.products?.price || 0
    return total + (price * item.quantity)
  }, 0)
})

const handleCheckout = async () => {
  isCheckingOut.value = true
  // Simulate a small delay for "professional" feel (processing payment)
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const success = await checkoutCart()
  if (success) {
    showSuccess.value = true
  }
  isCheckingOut.value = false
}
</script>

<template>
  <div class="page-container">

    <header class="header-section fade-in">
      <NuxtLink to="/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Lanjut Belanja
      </NuxtLink>
      <h1 class="page-title">Keranjang Anda</h1>
    </header>

    <main class="main-content fade-in">
      <div v-if="showSuccess" class="empty-state success-state glass">
        <div class="success-icon">✨</div>
        <h2>Pesanan Berhasil!</h2>
        <p>Terima kasih telah berbelanja. Pesanan Anda sedang kami proses.</p>
        <NuxtLink to="/" class="action-btn primary">Kembali ke Katalog</NuxtLink>
      </div>

      <div v-else-if="pending" class="loading-state glass">
        <p>Memuat keranjang...</p>
      </div>

      <div v-else-if="cartItems.length === 0" class="empty-state glass">
        <div class="empty-icon">🛒</div>
        <h2>Keranjang Kosong</h2>
        <p>Anda belum menambahkan produk apapun ke keranjang.</p>
        <NuxtLink to="/" class="action-btn primary">Mulai Belanja</NuxtLink>
      </div>

      <div v-else class="cart-grid">
        <div class="cart-items-section glass">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="item-image-box">
               <NuxtImg 
                  :src="item.products?.images?.[0] || item.products?.image_url" 
                  :alt="item.products?.title" 
                  class="item-image" 
                  loading="lazy" 
                  format="webp" 
                  width="100"
                  height="100"
               />
            </div>
            
            <div class="item-details">
              <h3 class="item-title">{{ item.products?.title }}</h3>
              <p class="item-price">Rp {{ (item.products?.price || 0).toLocaleString('id-ID') }}</p>
              
              <div class="item-actions">
                <div class="quantity-controls">
                  <button @click="updateItemQuantity(item.id, item.quantity - 1)" :disabled="item.quantity <= 1" class="qty-btn">-</button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button @click="updateItemQuantity(item.id, item.quantity + 1)" class="qty-btn">+</button>
                </div>
                <button @click="openConfirmModal(item.id)" class="remove-btn">
                  Hapus
                </button>
              </div>
            </div>
            <div class="item-total">
              Rp {{ ((item.products?.price || 0) * item.quantity).toLocaleString('id-ID') }}
            </div>
          </div>
        </div>

        <div class="cart-summary-section glass">
          <h2 class="summary-title">Ringkasan Belanja</h2>
          
          <div class="summary-row">
            <span>Total Harga ({{ cartItems.length }} barang)</span>
            <span>Rp {{ totalPrice.toLocaleString('id-ID') }}</span>
          </div>
          
          <div class="summary-total">
            <span>Total Belanja</span>
            <span class="grand-total">Rp {{ totalPrice.toLocaleString('id-ID') }}</span>
           </div>

          <button 
            class="action-btn primary w-full" 
            @click="handleCheckout" 
            :disabled="isCheckingOut"
          >
            <span v-if="isCheckingOut">Memproses...</span>
            <span v-else>Beli Sekarang (Rp {{ totalPrice.toLocaleString('id-ID') }})</span>
          </button>
        </div>
      </div>
    </main>

    <LazyMoleculesConfirmModal
      v-model="showConfirmModal"
      title="Hapus dari Keranjang"
      message="Apakah Anda yakin ingin menghapus produk ini dari keranjang belanja?"
      confirm-text="Ya, Hapus"
      cancel-text="Batal"
      :loading="isDeleting"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<style scoped src="~/assets/css/pages/cart.css"></style>
