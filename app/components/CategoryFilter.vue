<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  activeCategory: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['select-category'])

// Parse "Parent > Sub" into structure
const categoryTree = computed(() => {
  const tree = {}
  props.categories.forEach(cat => {
    if (!cat) return
    const parts = cat.split('>').map(p => p.trim())
    if (parts.length >= 2) {
      const parent = parts[0]
      const sub = parts.slice(1).join(' > ')
      if (!tree[parent]) tree[parent] = []
      if (!tree[parent].includes(sub)) tree[parent].push(sub)
    } else {
      // No separator → treat as parent with no sub
      if (!tree[parts[0]]) tree[parts[0]] = []
    }
  })
  return tree
})

const parentCategories = computed(() => Object.keys(categoryTree.value))

// Active parent derived from activeCategory prop
const activeParent = computed(() => {
  if (props.activeCategory === 'all') return null
  const parts = props.activeCategory.split('>').map(p => p.trim())
  return parts[0]
})

const subCategories = computed(() => {
  if (!activeParent.value) return []
  return categoryTree.value[activeParent.value] || []
})

const selectParent = (parent) => {
  const subs = categoryTree.value[parent] || []
  if (subs.length === 0) {
    // No sub-categories → filter directly
    emit('select-category', parent)
  } else if (activeParent.value === parent) {
    // Clicking active parent again → collapse / reset
    emit('select-category', 'all')
  } else {
    // Emit full category if only 1 sub, else wait for sub selection
    // Just open the sub bar — emit the parent as active
    emit('select-category', parent)
  }
}

const selectSub = (sub) => {
  const full = `${activeParent.value} > ${sub}`
  if (props.activeCategory === full) {
    // clicking active sub resets to parent only
    emit('select-category', activeParent.value)
  } else {
    emit('select-category', full)
  }
}

const activeSub = computed(() => {
  if (!props.activeCategory || props.activeCategory === 'all') return null
  const parts = props.activeCategory.split('>').map(p => p.trim())
  return parts.length >= 2 ? parts.slice(1).join(' > ') : null
})
</script>

<template>
  <div class="category-filter-wrapper fade-in">
    <!-- Level 1: Parent Categories -->
    <div class="category-filter">
      <button
        class="cat-btn glass"
        :class="{ active: activeCategory === 'all' }"
        @click="$emit('select-category', 'all')"
      >
        All Products
      </button>
      <button
        v-for="parent in parentCategories"
        :key="parent"
        class="cat-btn glass"
        :class="{ active: activeParent === parent }"
        @click="selectParent(parent)"
      >
        {{ parent }}
        <span v-if="categoryTree[parent]?.length > 0" class="chevron" :class="{ open: activeParent === parent }">›</span>
      </button>
    </div>

    <!-- Level 2: Sub Categories (animated) -->
    <Transition name="sub-slide">
      <div v-if="activeParent && subCategories.length > 0" class="sub-category-filter">
        <button
          v-for="sub in subCategories"
          :key="sub"
          class="sub-btn"
          :class="{ active: activeSub === sub }"
          @click="selectSub(sub)"
        >
          {{ sub }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.category-filter-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

/* --- Level 1 --- */
.category-filter {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 6px 4px;
  max-width: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.category-filter::-webkit-scrollbar { display: none; }

.cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #94a3b8;
  padding: 9px 18px;
  border-radius: 25px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.cat-btn:hover {
  background: rgba(45, 55, 75, 0.6);
  color: #f8fafc;
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.12);
}

.cat-btn.active {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.chevron {
  font-size: 1.1rem;
  line-height: 1;
  transition: transform 0.25s ease;
  display: inline-block;
}
.chevron.open {
  transform: rotate(90deg);
}

/* --- Level 2 --- */
.sub-category-filter {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 6px 4px 6px 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-left: 2px solid rgba(99, 102, 241, 0.35);
  margin-left: 4px;
}
.sub-category-filter::-webkit-scrollbar { display: none; }

.sub-btn {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #94a3b8;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.sub-btn:hover {
  background: rgba(99, 102, 241, 0.18);
  color: #c7d2fe;
  transform: translateY(-1px);
}
.sub-btn.active {
  background: rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

/* --- Transition --- */
.sub-slide-enter-active,
.sub-slide-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.sub-slide-enter-from,
.sub-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.sub-slide-enter-to,
.sub-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 100px;
}
</style>
