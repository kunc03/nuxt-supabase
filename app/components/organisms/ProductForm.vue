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

const handleSubmit = () => {
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
        <input type="text" id="title" v-model="form.title" placeholder="Masukkan judul produk" required />
      </div>

      <div class="form-group">
        <label for="sub_title">Sub Title</label>
        <input type="text" id="sub_title" v-model="form.sub_title" placeholder="Sub judul singkat" />
      </div>

      <div class="form-group">
        <label for="description">Deskripsi</label>
        <textarea id="description" v-model="form.description" rows="4" placeholder="Deskripsi produk lengkap"></textarea>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="category">Kategori</label>
          <input type="text" id="category" v-model="form.category" placeholder="Elektronik, Pakaian, dll." />
        </div>

        <div class="form-group">
          <label for="image_url">Image URL</label>
          <input type="url" id="image_url" v-model="form.image_url" placeholder="https://example.com/image.jpg" />
        </div>
      </div>

      <!-- Detail Images Array Input -->
      <div class="form-group">
        <label for="images">Detail Images (Satu URL per baris)</label>
        <textarea id="images" v-model="imagesText" rows="3" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"></textarea>
      </div>

      <div class="form-grid three-cols">
        <div class="form-group">
          <label for="price">Harga</label>
          <input type="number" id="price" v-model="form.price" step="0.01" placeholder="0.00" />
        </div>

        <div class="form-group">
          <label for="stock">Stok</label>
          <input type="number" id="stock" v-model="form.stock" placeholder="0" />
        </div>

        <div class="form-group">
          <label for="rate">Rating (0-5)</label>
          <input type="number" id="rate" v-model="form.rate" step="0.1" min="0" max="5" placeholder="4.5" />
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
