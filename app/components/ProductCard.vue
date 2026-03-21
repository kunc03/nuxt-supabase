<script setup>
defineProps({
  product: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="product-card glass fade-in">
    <div class="image-container">
      <img :src="product.image_url || product.image" :alt="product.title" class="product-image" loading="lazy" />
      <div class="overlay">
        <span class="rating">★ {{ product.rate ?? product.rating?.rate }}</span>
      </div>
    </div>
    <div class="product-content">
      <div class="category-badge">{{ product.category }}</div>
      <h3 class="product-title" :title="product.title">{{ product.title }}</h3>
      <p v-if="product.sub_title" class="product-subtitle">{{ product.sub_title }}</p>
      <p class="product-description">{{ product.description }}</p>
      <div class="product-footer">
        <div class="price-tag">
          <span class="currency">Rp</span>
          <span class="price">{{ (product.price || 0).toLocaleString('id-ID') }}</span>
        </div>
        <button class="view-btn">View</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.product-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
}

.image-container {
  position: relative;
  width: 100%;
  padding-bottom: 75%; /* 4:3 Aspect Ratio */
  background: white;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.product-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: auto;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: translate(-50%, -50%) scale(1.1);
}

.overlay {
  position: absolute;
  top: 12px;
  right: 12px;
}

.rating {
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(4px);
  color: #fbbf24;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.product-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.category-badge {
  display: inline-block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary, #6366f1);
  font-weight: 800;
  margin-bottom: 8px;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #f8fafc;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.6rem;
  line-height: 1.3;
}

.product-subtitle {
  font-size: 0.85rem;
  font-style: italic;
  color: #a855f7;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.price-tag {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.currency {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-secondary, #a855f7);
}

.price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
}

.view-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: #f8fafc;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
  border-color: transparent;
}
</style>
