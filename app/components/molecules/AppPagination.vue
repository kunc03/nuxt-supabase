<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['update:modelValue'])

const changePage = (page) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:modelValue', page)
  }
}
</script>

<template>
  <div class="pagination-controls fade-in">
    <button 
      @click="changePage(modelValue - 1)" 
      class="pag-btn"
      :disabled="modelValue === 1"
    >
      &larr; Prev
    </button>
    
    <div class="pag-numbers">
      <button 
        v-for="page in totalPages" 
        :key="page"
        @click="changePage(page)"
        class="pag-num"
        :class="{ active: modelValue === page }"
      >
        {{ page }}
      </button>
    </div>

    <button 
      @click="changePage(modelValue + 1)" 
      class="pag-btn"
      :disabled="modelValue === totalPages"
    >
      Next &rarr;
    </button>
  </div>
</template>

<style scoped>
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 50px;
  padding-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.pag-btn {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pag-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.1);
  color: #f8fafc;
  border-color: rgba(99, 102, 241, 0.3);
}

.pag-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pag-numbers {
  display: flex;
  gap: 8px;
}

.pag-num {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pag-num:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
}

.pag-num.active {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
</style>
