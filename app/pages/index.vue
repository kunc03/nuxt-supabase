<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import useApi from '~/../composables/useApi'

// supabase 
const { fetchProducts } = useApi();
const supabase = useSupabaseClient();

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
