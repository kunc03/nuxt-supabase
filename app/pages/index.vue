<script setup>
import { ref, computed } from 'vue'
import useApi from '~/../composables/useApi'

// supabase 
const { fetchProducts } = useApi();

const { data: productsSupabase, pending, refresh } = await useAsyncData('products', () => 
  fetchProducts()
)

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

const handleSelectCategory = (category) => {
  activeCategory.value = category
  currentPage.value = 1 // Reset to page 1 on category change
}

const filteredProducts = computed(() => {
  if (!productsSupabase.value) return []
  if (activeCategory.value === 'all') return productsSupabase.value

  const active = activeCategory.value
  // If active contains '>', it's an exact "Parent > Sub" match
  if (active.includes('>')) {
    return productsSupabase.value.filter(p => p.category === active)
  }
  // Otherwise it's a parent-only selection → match all products in that parent
  return productsSupabase.value.filter(p => {
    if (!p.category) return false
    const parent = p.category.split('>')[0].trim()
    return parent === active
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Smooth scroll back to products section top
    window.scrollTo({ top: 250, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="page-container">
    <OrganismsHeroSection />

    <main class="main-content">
      <section class="filter-section">
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
