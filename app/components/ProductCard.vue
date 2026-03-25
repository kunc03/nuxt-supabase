<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '~/../composables/useCartStore'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const user = useSupabaseUser()
const cartStore = useCartStore()
const isAddingToCart = ref(false)

const addToCart = async (product) => {
  if (!user.value) {
    router.push('/login')
    return
  }

  if (cartStore.isInCart(product.id)) return
  
  isAddingToCart.value = true
  await cartStore.addToCart(product.id)
  isAddingToCart.value = false
}

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
        <img :src="product.images?.[0] || product.image_url" :alt="product.title" class="product-image" loading="lazy" />
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
          <button @click.stop.prevent="addToCart(product)" class="cart-btn" :class="{ 'added': cartStore.isInCart(product.id) }" :disabled="isAddingToCart || cartStore.isInCart(product.id)" :title="cartStore.isInCart(product.id) ? 'Sudah di Keranjang' : 'Tambah ke Keranjang'">
            <CartIcon :is-added="cartStore.isInCart(product.id)" width="18" height="18" />
          </button>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<style scoped src="~/assets/css/components/product-card.css"></style>
