<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import useApi from '~/../composables/useApi'

const route = useRoute()
const { fetchProduct } = useApi()
const client = useSupabaseClient()

// Ambil ID dari router params
const productId = route.params.id

// Fetch data produk
const { data: product, pending, error } = await useAsyncData(`product-${productId}`, () => 
  fetchProduct(productId)
)

const viewerCount = ref(1)
let channel = null

// Realtime Presence & Live Update Setup
onMounted(() => {
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
      console.log('Product Live Update:', payload)
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
              <img :src="img" alt="Detail Thumb" />
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

            <button class="action-btn primary">
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.header-section {
  margin-bottom: 30px;
  padding-top: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #6366f1;
}

.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 500px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 100%);
  filter: blur(60px);
  z-index: -1;
  pointer-events: none;
}

/* State Boxes */
.loading-state, .error-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.retry-btn {
  display: inline-block;
  margin-top: 16px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  padding: 10px 24px;
  border-radius: 12px;
  text-decoration: none;
}

/* Product Detail Grid */
.product-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 40px;
  align-items: start;
}

/* Image Gallery Section */
.image-gallery-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image-box {
  position: relative;
  background: white;
  border-radius: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  height: 450px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnails-grid {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px;
}

.thumb-item {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  background: white;
  padding: 0;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-item.active {
  border-color: #6366f1;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
}

.overlay {
  position: absolute;
  top: 20px;
  right: 20px;
}

.rating {
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(4px);
  color: #fbbf24;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

/* Info Section */
.info-section {
  padding: 35px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.category-badge {
  display: inline-block;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #6366f1;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.product-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.2;
  margin-bottom: 8px;
}

.product-subtitle {
  font-size: 1.1rem;
  font-style: italic;
  color: #a855f7;
  margin-bottom: 24px;
}

.section-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 12px;
}

.product-description {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 30px;
}

.stats-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
  margin-bottom: auto;
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
}

.viewers-count {
  color: #f97316;
  font-weight: 700;
}

/* Footer Section */
.content-footer {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.price-label {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
}

.price-tag {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.currency {
  font-size: 1.1rem;
  font-weight: 600;
  color: #a855f7;
}

.price {
  font-size: 2rem;
  font-weight: 800;
  color: #f8fafc;
}

.action-btn {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  padding: 16px 32px;
  border-radius: 16px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  border: none;
  flex: 1;
  text-align: center;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

@media (max-width: 900px) {
  .product-detail-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .image-section {
    height: 350px;
  }
}
</style>
