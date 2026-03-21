<script setup>
defineProps({
  categories: {
    type: Array,
    required: true
  },
  activeCategory: {
    type: String,
    default: 'all'
  }
})

defineEmits(['select-category'])
</script>

<template>
  <div class="category-filter fade-in">
    <button 
      class="cat-btn glass"
      :class="{ active: activeCategory === 'all' }"
      @click="$emit('select-category', 'all')"
    >
      All Products
    </button>
    <button 
      v-for="category in categories" 
      :key="category"
      class="cat-btn glass"
      :class="{ active: activeCategory === category }"
      @click="$emit('select-category', category)"
    >
      {{ category }}
    </button>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 10px 5px;
  margin-bottom: 30px;
  max-width: 100%;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.category-filter::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

.cat-btn {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: capitalize;
}

.cat-btn:hover {
  background: rgba(45, 55, 75, 0.6);
  color: #f8fafc;
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.1);
}

.cat-btn.active {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}
</style>
