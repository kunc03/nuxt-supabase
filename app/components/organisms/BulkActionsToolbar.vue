<script setup>
defineProps({
  selectedCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'delete'])
</script>

<template>
  <div class="bulk-actions-toolbar glass">
    <div class="toolbar-left">
      <label class="checkbox-container">
        <input 
          type="checkbox" 
          :checked="modelValue" 
          @change="$emit('update:modelValue', $event.target.checked)" 
        />
        <span class="checkmark"></span>
        <span class="label-text">Pilih Semua ({{ selectedCount }})</span>
      </label>
    </div>
    <div class="toolbar-right">
      <button 
        v-if="selectedCount > 0" 
        @click="$emit('delete')" 
        class="delete-bulk-btn" 
        :disabled="loading"
      >
        ❌ Hapus Terpilih
      </button>
    </div>
  </div>
</template>

<style scoped>
.bulk-actions-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  margin-bottom: 16px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 12px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
  gap: 10px;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 18px;
  width: 18px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: rgba(255, 255, 255, 0.2);
}

.checkbox-container input:checked ~ .checkmark {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-color: transparent;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.delete-bulk-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-bulk-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
}
</style>
