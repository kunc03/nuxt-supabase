<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isEditing: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  initialForm: { type: Object, required: true },
  initialImagesText: { type: String, default: '' }
})

const emit = defineEmits(['submit', 'cancel'])

const form = ref({ ...props.initialForm })
const imagesText = ref(props.initialImagesText)

watch(() => props.initialForm, (newVal) => {
  form.value = { ...newVal }
}, { deep: true })

watch(() => props.initialImagesText, (newVal) => {
  imagesText.value = newVal
})

const errors = ref({
  title: '',
  sub_title: '',
  description: '',
  category: '',
  image_url: '',
  imagesText: '',
  price: '',
  stock: '',
  rate: ''
})

const handleSubmit = () => {
  // Reset errors
  Object.keys(errors.value).forEach(key => errors.value[key] = '')

  let hasError = false

    if (!form.value.title) { errors.value.title = 'Title wajib diisi!'; hasError = true }
    if (!form.value.sub_title) { errors.value.sub_title = 'Sub Title wajib diisi!'; hasError = true }
    if (!form.value.description) { errors.value.description = 'Deskripsi wajib diisi!'; hasError = true }
    if (!form.value.category) { errors.value.category = 'Kategori wajib diisi!'; hasError = true }
    if (!form.value.image_url) { errors.value.image_url = 'Image URL wajib diisi!'; hasError = true }
    if (!imagesText.value) { errors.value.imagesText = 'Detail Images wajib diisi!'; hasError = true }
    
    if (form.value.price === null || form.value.price === '' || form.value.price === undefined) { 
      errors.value.price = 'Harga wajib diisi!'; hasError = true 
    }
    if (form.value.stock === null || form.value.stock === '' || form.value.stock === undefined) { 
      errors.value.stock = 'Stok wajib diisi!'; hasError = true 
    }
    if (form.value.rate === null || form.value.rate === '' || form.value.rate === undefined) { 
      errors.value.rate = 'Rate wajib diisi!'; hasError = true 
    }

  if (hasError) return

  emit('submit', { 
    ...form.value, 
    imagesText: imagesText.value 
  })
}
</script>

<template>
  <div class="form-wrapper glass">
    <div class="form-header">
      <h2 class="form-title">{{ isEditing ? 'Edit Produk' : 'Tambah Produk' }}</h2>
      <button @click="$emit('cancel')" class="cancel-link">Batal</button>
    </div>

    <form @submit.prevent="handleSubmit" class="product-form">
      <div class="form-group">
        <label for="title">Title <span class="required">*</span></label>
        <input type="text" id="title" v-model="form.title" placeholder="Masukkan judul produk" />
        <span class="error-msg" v-if="errors.title">{{ errors.title }}</span>
      </div>

      <div class="form-group">
        <label for="sub_title">Sub Title <span class="required">*</span></label>
        <input type="text" id="sub_title" v-model="form.sub_title" placeholder="Sub judul singkat" />
        <span class="error-msg" v-if="errors.sub_title">{{ errors.sub_title }}</span>
      </div>

      <div class="form-group">
        <label for="description">Deskripsi <span class="required">*</span></label>
        <textarea id="description" v-model="form.description" rows="4" placeholder="Deskripsi produk lengkap"></textarea>
        <span class="error-msg" v-if="errors.description">{{ errors.description }}</span>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="category">Kategori <span class="required">*</span></label>
          <input type="text" id="category" v-model="form.category" placeholder="Elektronik, Pakaian, dll." />
          <span class="error-msg" v-if="errors.category">{{ errors.category }}</span>
        </div>

        <div class="form-group">
          <label for="image_url">Image URL <span class="required">*</span></label>
          <input type="url" id="image_url" v-model="form.image_url" placeholder="https://example.com/image.jpg" />
          <span class="error-msg" v-if="errors.image_url">{{ errors.image_url }}</span>
        </div>
      </div>

      <!-- Detail Images Array Input -->
      <div class="form-group">
        <label for="images">Detail Images (Satu URL per baris) <span class="required">*</span></label>
        <textarea id="images" v-model="imagesText" rows="3" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"></textarea>
        <span class="error-msg" v-if="errors.imagesText">{{ errors.imagesText }}</span>
      </div>

      <div class="form-grid three-cols">
        <div class="form-group">
          <label for="price">Harga <span class="required">*</span></label>
          <input type="number" id="price" v-model="form.price" step="0.01" placeholder="0.00" />
          <span class="error-msg" v-if="errors.price">{{ errors.price }}</span>
        </div>

        <div class="form-group">
          <label for="stock">Stok <span class="required">*</span></label>
          <input type="number" id="stock" v-model="form.stock" placeholder="0" />
          <span class="error-msg" v-if="errors.stock">{{ errors.stock }}</span>
        </div>

        <div class="form-group">
          <label for="rate">Rating (0-5) <span class="required">*</span></label>
          <input type="number" id="rate" v-model="form.rate" step="0.1" min="0" max="5" placeholder="4.5" />
          <span class="error-msg" v-if="errors.rate">{{ errors.rate }}</span>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading">Menyimpan...</span>
          <span v-else>{{ isEditing ? 'Update Produk' : 'Simpan Produk' }}</span>
        </button>
        <button type="button" @click="$emit('cancel')" class="reset-btn" :disabled="loading">
          Kembali
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped src="~/assets/css/components/product-form.css"></style>
<style scoped>
.error-msg {
  color: #ff4d4f;
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}
</style>
