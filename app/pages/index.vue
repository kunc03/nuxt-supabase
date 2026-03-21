<script setup>
import { ref, computed } from 'vue'
import useApi from '~/../composables/useApi'

// supabase 
const { fetchProducts } = useApi();

const { data: productsSupabase, pending, refresh } = await useAsyncData('products', () => 
  fetchProducts()
)

console.log(productsSupabase.value) 

const categories = computed(() => {
  if (!productsSupabase.value) return []
  const cats = productsSupabase.value.map(p => p.category)
  return [...new Set(cats)]
})

const categoriesPending = pending
const productsPending = pending

const activeCategory = ref('all')

const handleSelectCategory = (category) => {
  activeCategory.value = category
}

const filteredProducts = computed(() => {
  if (!productsSupabase.value) return []
  if (activeCategory.value === 'all') return productsSupabase.value
  return productsSupabase.value.filter(product => product.category === activeCategory.value)
})
</script>

<template>
  <div class="page-container">
    <header class="hero-section fade-in">
      <div class="ambient-glow"></div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">Future</span> of Shopping
        </h1>
        <p class="hero-subtitle">
          Discover our curated collection of premium products with stunning aesthetics.
        </p>
      </div>
    </header>

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
        
        <div v-else-if="filteredProducts.length > 0" class="products-grid">
          <ProductCard 
            v-for="product in filteredProducts" 
            :key="product.id" 
            :product="product" 
          />
        </div>

        <div v-else class="no-results glass fade-in">
          <p>No products found in this category.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 80px 20px;
  position: relative;
}

/* Ambient Glow Backgrounds */
.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%);
  filter: blur(60px);
  z-index: -1;
  pointer-events: none;
}

.hero-section {
  text-align: center;
  padding: 80px 0 60px 0;
  position: relative;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  color: #94a3b8;
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.main-content {
  position: relative;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #f8fafc;
}

.filter-section {
  margin-bottom: 40px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  border-radius: 16px;
  background: rgba(30, 41, 59, 0.4);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
}
</style>
