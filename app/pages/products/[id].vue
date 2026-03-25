<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import useApi from '~/../composables/useApi'
import { useCartStore } from '~/../composables/useCartStore'

const route = useRoute()
const router = useRouter()
const { fetchProduct } = useApi()
const client = useSupabaseClient()
const user = useSupabaseUser()

// Ambil ID dari router params
const productId = route.params.id

// Fetch data produk
const { data: product, pending, error } = await useAsyncData(`product-${productId}`, () => 
  fetchProduct(productId), { deep: false }
)

const viewerCount = ref(1)
let channel = null
const cartStore = useCartStore()

// Realtime Presence & Live Update Setup
onMounted(async () => {
  cartStore.fetchCartProductIds()

  channel = client.channel(`product_views_${productId}`)

  // 1. Presence (Viewer Count)
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      viewerCount.value = Object.keys(state).length
    })
    // 2. Postgres Changes (Live Details)
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'products', 
      filter: `id=eq.${productId}` 
    }, (payload) => {
      if (product.value) {
        // Merge updates
        product.value = { ...product.value, ...payload.new }
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ 
          user_id: Math.random().toString(36).substring(7), // Anon user identification
          viewing_at: new Date().toISOString() 
        })
      }
    })
})

onUnmounted(() => {
  if (channel) {
    client.removeChannel(channel)
  }
})

// Logic untuk switch gambar utama
const selectedImage = ref('')
watch(product, (newVal) => {
  if (newVal?.images?.length > 0) {
    selectedImage.value = newVal.images[0]
  }
}, { immediate: true })

// Add to Cart Logic
const isAddingToCart = ref(false)

const addToCart = async () => {
  if (!user.value) {
    router.push('/login')
    return
  }

  isAddingToCart.value = true
  await cartStore.addToCart(Number(productId) || productId)
  isAddingToCart.value = false
}
</script>

<template>
  <div class="page-container">
    <div class="ambient-glow"></div>

    <!-- Back Navigation -->
    <header class="header-section fade-in">
      <NuxtLink to="/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Kembali ke Katalog
      </NuxtLink>
    </header>

    <!-- Content Area -->
    <main class="main-content fade-in">
      <div v-if="pending" class="loading-state glass">
        <p>Memuat detail produk...</p>
      </div>

      <div v-else-if="error || !product" class="error-state glass">
        <p>Gagal memuat produk. Produk mungkin tidak ditemukan atau terjadi kesalahan.</p>
        <NuxtLink to="/" class="retry-btn">Kembali ke Katalog</NuxtLink>
      </div>

      <div v-else class="product-detail-grid">
        <!-- Left: Image Section & Gallery -->
        <div class="image-gallery-section">
          <div class="main-image-box glass">
            <img :src="selectedImage || (product.images?.length > 0 ? product.images[0] : '')" :alt="product.title" class="product-image" />
            <div class="overlay">
              <span class="rating">★ {{ product.rate ?? '0' }}</span>
            </div>
          </div>
          
          <!-- Thumbnails Tray -->
          <div v-if="product.images?.length > 0" class="thumbnails-grid">
            <!-- Additional Images -->
            <div 
              v-for="(img, idx) in product.images" 
              :key="idx" 
              class="thumb-item glass"
              :class="{ active: selectedImage === img }"
              @click="selectedImage = img"
            >
              <img :src="img" alt="Detail Thumb" loading="lazy" />
            </div>
          </div>
        </div>

        <!-- Right: Info Section -->
        <div class="info-section glass">
          <div class="content-header">
            <span class="category-badge">{{ product.category }}</span>
            <h1 class="product-title">{{ product.title }}</h1>
            <p v-if="product.sub_title" class="product-subtitle">{{ product.sub_title }}</p>
          </div>

          <div class="content-body">
            <h2 class="section-heading">Deskripsi</h2>
            <p class="product-description">{{ product.description || 'Tidak ada deskripsi untuk produk ini.' }}</p>
            
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">Stok tersedia</span>
                <span class="stat-value">{{ product.stock ?? 0 }} pcs</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Sedang melihat</span>
                <span class="stat-value viewers-count">🔥 {{ viewerCount }} orang</span>
              </div>
            </div>
          </div>

          <div class="content-footer">
            <div class="price-container">
              <span class="price-label">Harga</span>
              <div class="price-tag">
                <span class="currency">Rp</span>
                <span class="price">{{ (product.price || 0).toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <div class="action-buttons">
              <button class="action-btn secondary icon-btn" @click="addToCart" :disabled="isAddingToCart || cartStore.isInCart(Number(productId) || productId)" :title="cartStore.isInCart(Number(productId) || productId) ? 'Sudah di Keranjang' : 'Simpan ke Keranjang'">
                <template v-if="isAddingToCart">
                  ...
                </template>
                <template v-else>
                  <CartIcon :is-added="cartStore.isInCart(Number(productId) || productId)" width="24" height="24" />
                </template>
              </button>
              <button class="action-btn primary">
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped src="~/assets/css/pages/product-detail.css"></style>
