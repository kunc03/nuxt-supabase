<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import useApi from '~/../composables/useApi'

// supabase 
const { fetchProducts } = useApi();
const supabase = useSupabaseClient();
const user = useSupabaseUser(); // Tambahkan user state

// Fungsi Logout
const handleLogout = async () => {
  await supabase.auth.signOut()
}

// Computed untuk Admin
const isAdmin = computed(() => user.value?.user_metadata?.role === 'admin')

const { data: productsSupabase, pending, refresh } = await useAsyncData('products', () => 
  fetchProducts()
)

// Realtime subscription
let channel = null;

onMounted(() => {
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
    </main>
  </div>
</template>

<style scoped src="~/assets/css/pages/index.css"></style>
<style scoped>
/* Top Nav / Header Styles */
.top-nav {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 41, 59, 0.5);
  padding: 6px 12px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.nav-avatar, .nav-avatar-fallback {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

.nav-avatar {
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-avatar-fallback {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.user-email {
  color: #cbd5e1;
  font-size: 0.85rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-btn {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.login-link {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.admin-link {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3) !important;
}

.logout-link {
  background: transparent;
  color: #94a3b8;
  padding: 4px 8px;
  font-size: 0.8rem;
}

.logout-link:hover {
  color: #ef4444;
}

.nav-btn:hover:not(.logout-link) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}

/* Custom Tooltip Style */
.avatar-tooltip {
  position: relative;
  display: flex;
}

.avatar-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(5px);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 50;
}

.avatar-tooltip::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) translateY(5px);
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent rgba(15, 23, 42, 0.95) transparent;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 50;
}

.avatar-tooltip:hover::after,
.avatar-tooltip:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
