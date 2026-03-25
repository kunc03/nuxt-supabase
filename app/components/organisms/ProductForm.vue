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

const client = useSupabaseClient()
const uploading = ref(false)
const uploadError = ref('')

const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  uploading.value = true
  uploadError.value = ''

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${fileName}` // Langsung di root bucket 'products'

    const { data, error } = await client.storage
      .from('products')
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = client.storage
      .from('products')
      .getPublicUrl(filePath)

    form.value.image_url = publicUrl
  } catch (error) {
    uploadError.value = 'Gagal mengunggah gambar: ' + error.message
  } finally {
    uploading.value = false
  }
}

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
const uploadingMultiple = ref(false)
const uploadMultipleError = ref('')

const handleMultipleFilesUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  uploadingMultiple.value = true
  uploadMultipleError.value = ''

  const uploadedUrls = []

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await client.storage
        .from('products')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = client.storage
        .from('products')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    const currentText = imagesText.value ? imagesText.value.trim() : ''
    const newUrls = uploadedUrls.join('\n')
    imagesText.value = currentText ? `${currentText}\n${newUrls}` : newUrls

  } catch (error) {
    uploadMultipleError.value = 'Gagal mengunggah beberapa gambar: ' + error.message
  } finally {
    uploadingMultiple.value = false
  }
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
          <label for="image_url">Image <span class="required">*</span></label>
          <div class="image-input-container">
            <input type="url" id="image_url" v-model="form.image_url" placeholder="https://example.com/image.jpg" class="url-input" />
            <div class="upload-trigger">
              <input type="file" id="file_upload" @change="handleFileUpload" accept="image/*" class="hidden-file-input" />
              <label for="file_upload" class="upload-btn" :class="{ 'uploading': uploading }">
                <span>{{ uploading ? 'Uploading...' : 'Upload File' }}</span>
              </label>
            </div>
          </div>
          <!-- Preview Image -->
          <div v-if="form.image_url" class="image-preview-container">
            <img :src="form.image_url" alt="Preview Gambar" class="image-preview" />
          </div>
          <span class="error-msg" v-if="errors.image_url">{{ errors.image_url }}</span>
          <span class="error-msg" v-if="uploadError">{{ uploadError }}</span>
        </div>
      </div>

      <!-- Detail Images Array Input -->
      <div class="form-group">
        <label for="images">Detail Images (Satu URL per baris) <span class="required">*</span></label>
        <div class="textarea-upload-container">
          <textarea id="images" v-model="imagesText" rows="4" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"></textarea>
          <div class="upload-trigger">
            <input type="file" id="multiple_upload" @change="handleMultipleFilesUpload" accept="image/*" multiple class="hidden-file-input" />
            <label for="multiple_upload" class="upload-btn" :class="{ 'uploading': uploadingMultiple }">
              <span>{{ uploadingMultiple ? 'Uploading...' : '📁 Upload Banyak Gambar' }}</span>
            </label>
          </div>
        </div>
        <span class="error-msg" v-if="errors.imagesText">{{ errors.imagesText }}</span>
        <span class="error-msg" v-if="uploadMultipleError">{{ uploadMultipleError }}</span>
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

/* Modifikasi Baru untuk Upload Gambar */
.image-input-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.url-input {
  flex: 1;
}

.upload-trigger {
  position: relative;
}

.hidden-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f8fafc;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #6366f1;
}

.upload-btn.uploading {
  opacity: 0.7;
  cursor: not-allowed;
  background: rgba(100, 100, 100, 0.2);
}

.image-preview-container {
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  max-width: 200px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-preview {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.textarea-upload-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.textarea-upload-container .upload-btn {
  align-self: flex-start;
}
</style>
