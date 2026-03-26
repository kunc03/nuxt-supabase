<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import useApi from '~/../composables/useApi'
import { useCartStore } from '~/../composables/useCartStore'

// SEO Meta
useSeoMeta({
  title: 'Home | Modern Glassmorphism Catalog',
  ogTitle: 'Home | Modern Glassmorphism Catalog',
  description: 'Temukan produk impian Anda dengan desain modern dan premium.',
  ogDescription: 'Temukan produk impian Anda dengan desain modern dan premium.',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
})

// supabase 
const { fetchProducts } = useApi();
const supabase = useSupabaseClient();
const user = useSupabaseUser(); // Tambahkan user state

// Fungsi Logout
const handleLogout = async () => {
  cartStore.clearCart()
  await supabase.auth.signOut()
}

// Computed untuk Admin
const isAdmin = computed(() => user.value?.user_metadata?.role === 'admin')

const { data: productsSupabase, pending, refresh } = await useAsyncData('products', () => 
  fetchProducts(), { deep: false }
)

const cartStore = useCartStore()
const cartProductIds = computed(() => cartStore.cartProductIds)

let channel = null;

onMounted(() => {
  cartStore.fetchCartProductIds()
  channel = supabase
    .channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      refresh() // Trigger useAsyncData refresh
    })
    .subscribe()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

const categories = computed(() => {
  if (!productsSupabase.value) return []
  const cats = productsSupabase.value.map(p => p.category).filter(Boolean)
  return [...new Set(cats)]
})

const categoriesPending = pending
const productsPending = pending

const activeCategory = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(12) // 12 items per page works well for multi-column grids
const searchQuery = ref('') // 🔍 Pencarian

const handleSelectCategory = (category) => {
  activeCategory.value = category
  currentPage.value = 1 // Reset to page 1 on category change
}

const filteredProducts = computed(() => {
  if (!productsSupabase.value) return []
  
  let result = productsSupabase.value

  // 1. Filter dari Kategori
  if (activeCategory.value !== 'all') {
    const active = activeCategory.value
    if (active.includes('>')) {
      result = result.filter(p => p.category === active)
    } else {
      result = result.filter(p => {
        if (!p.category) return false
        const parent = p.category.split('>')[0].trim()
        return parent === active
      })
    }
  }

  // 2. Filter dari Search Query
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const titleMatch = p.title?.toLowerCase().includes(query)
      const subtitleMatch = p.sub_title?.toLowerCase().includes(query)
      const descMatch = p.description?.toLowerCase().includes(query)
      return titleMatch || subtitleMatch || descMatch
    })
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

watch(currentPage, () => {
  window.scrollTo({ top: 250, behavior: 'smooth' })
})
</script>

<template>
  <div class="page-container">
    <!-- Top Nav / Header -->
    <div class="top-nav">
      <div v-if="user" class="nav-user-info">
        <div class="avatar-tooltip" :data-tooltip="user.email">
          <img v-if="user.user_metadata?.avatar_url" :src="user.user_metadata.avatar_url" class="nav-avatar" alt="Avatar" />
          <div v-else class="nav-avatar-fallback">{{ user.email ? user.email[0].toUpperCase() : 'U' }}</div>
        </div>
        
        <NuxtLink to="/cart" class="nav-btn keranjang-link" title="Keranjang">
          <CartIcon :is-added="false" width="18" height="18" />
          <span v-if="cartProductIds.length > 0" class="cart-badge">{{ cartProductIds.length }}</span>
        </NuxtLink>
        <NuxtLink v-if="isAdmin" to="/admin" class="nav-btn admin-link">Dashboard</NuxtLink>
        <button @click="handleLogout" class="nav-btn logout-link">Logout</button>
      </div>
      <NuxtLink v-else to="/login" class="nav-btn login-link">Login</NuxtLink>
    </div>

    <OrganismsHeroSection />

    <main class="main-content">
      <section class="filter-section">
        <!-- Search Bar -->
        <div class="search-bar-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari produk berdasarkan nama atau deskripsi..." 
            class="search-input"
            @input="currentPage = 1" 
          />
        </div>

        <h2 class="section-title">Browse Categories</h2>
        <div v-if="categoriesPending" class="categories-skeleton"></div>
        <CategoryFilter 
          v-else
          :categories="categories || []" 
          :active-category="activeCategory"
          @select-category="handleSelectCategory"
        />
      </section>

      <section class="products-section">
        <div v-if="productsPending" class="products-grid">
          <LoadingSkeleton v-for="n in 8" :key="n" />
        </div>
        
        <div v-else-if="paginatedProducts.length > 0">
          <div class="products-grid">
            <ProductCard 
              v-for="product in paginatedProducts" 
              :key="product.id" 
              :product="product"
            />
          </div>

          <!-- Pagination Controls -->
          <MoleculesAppPagination 
            v-if="totalPages > 1" 
            v-model="currentPage" 
            :totalPages="totalPages" 
          />
        </div>

        <div v-else class="no-results glass fade-in">
          <p>No products found in this category.</p>
        </div>
      </section>

      <!-- Nuxt Island Demo -->
      <!-- <section class="mt-20 mb-10 px-4" v-motion-fade-visible-once>
        <StaticDescription />
      </section> -->
    </main>
  </div>
</template>

<style scoped src="~/assets/css/pages/index.css"></style>
