<script setup>
import { computed } from 'vue'
import { useCart } from '~/../composables/useCart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const { addToCart } = useCart()

// Show only the last segment after ">" for cleaner badge display
const categoryLabel = computed(() => {
  if (!props.product.category) return ''
  const parts = props.product.category.split('>').map(p => p.trim())
  return parts[parts.length - 1]
})
</script>

<template>
  <div class="card-link-wrapper">
    <NuxtLink :to="`/products/${product.id}`" class="product-card glass fade-in">
      <div class="image-container">
        <img :src="product.image_url || product.image" :alt="product.title" class="product-image" loading="lazy" />
        <div class="overlay">
          <span class="rating">★ {{ product.rate ?? product.rating?.rate }}</span>
        </div>
      </div>
      <div class="product-content">
        <div class="category-badge">{{ categoryLabel }}</div>
        <h3 class="product-title" :title="product.title">{{ product.title }}</h3>
        <p v-if="product.sub_title" class="product-subtitle">{{ product.sub_title }}</p>
        <p class="product-description">{{ product.description }}</p>
        <div class="product-footer">
          <div class="price-tag">
            <span class="currency">Rp</span>
            <span class="price">{{ (product.price || 0).toLocaleString('id-ID') }}</span>
          </div>
          <button @click.stop.prevent="addToCart(product)" class="cart-btn" title="Tambah ke Keranjang">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<style scoped src="~/assets/css/components/product-card.css"></style>
