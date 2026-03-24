<script setup>
import { ref, onMounted, computed } from 'vue'
import useApi from '~/../composables/useApi'
import * as XLSX from 'xlsx' // <--- Membaca file excel

const user = useSupabaseUser()
const client = useSupabaseClient()
const router = useRouter()
const { fetchProducts, addProduct, updateProduct, deleteProduct } = useApi()

// Auth Guard
onMounted(() => {
  if (!user.value) {
    router.push('/login')
  }
})

const products = ref([])
const productsPending = ref(true)
const currentView = ref('list') // 'list' or 'form'
const isEditing = ref(false)
const selectedProductId = ref(null)

const form = ref({
  title: '',
  sub_title: '',
  description: '',
  category: '',
  image_url: '',
  price: null,
  stock: null,
  rate: null
})

const loading = ref(false)
const message = ref({ text: '', type: '' })

const loadProducts = async () => {
  productsPending.value = true
  try {
    products.value = await fetchProducts()
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    productsPending.value = false
  }
}

onMounted(loadProducts)

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/login')
}

const imagesText = ref('')

const openAddForm = () => {
  isEditing.value = false
  selectedProductId.value = null
  resetForm()
  imagesText.value = ''
  message.value = { text: '', type: '' }
  currentView.value = 'form'
}

const openEditForm = (product) => {
  isEditing.value = true
  selectedProductId.value = product.id
  form.value = {
    title: product.title || '',
    sub_title: product.sub_title || '',
    description: product.description || '',
    category: product.category || '',
    image_url: product.image_url || '',
    price: product.price,
    stock: product.stock,
    rate: product.rate
  }
  imagesText.value = product.images ? product.images.join('\n') : '' // <--- Load images ke text
  message.value = { text: '', type: '' }
  currentView.value = 'form'
}

const resetForm = () => {
  form.value = {
    title: '',
    sub_title: '',
    description: '',
    category: '',
    image_url: '',
    price: null,
    stock: null,
    rate: null
  }
  imagesText.value = '' // <--- Reset gambar detail
}

const handleDelete = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

  loading.value = true
  message.value = { text: '', type: '' }

  try {
    await deleteProduct(id)
    message.value = { text: 'Produk berhasil dihapus!', type: 'success' }
    await loadProducts()
    setTimeout(() => {
      message.value = { text: '', type: '' }
    }, 2000)
  } catch (error) {
    console.error('Error deleting product:', error)
    message.value = { text: 'Gagal menghapus produk: ' + error.message, type: 'error' }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.title) {
    message.value = { text: 'Title wajib diisi!', type: 'error' }
    return
  }

  loading.value = true
  message.value = { text: '', type: '' }

  try {
    const payload = {
      ...form.value,
      price: form.value.price !== null && form.value.price !== '' && form.value.price !== undefined ? Number(form.value.price) : null,
      stock: form.value.stock !== null && form.value.stock !== '' && form.value.stock !== undefined ? Number(form.value.stock) : null,
      rate: form.value.rate !== null && form.value.rate !== '' && form.value.rate !== undefined ? Number(form.value.rate) : null,
      images: imagesText.value.split('\n').map(u => u.trim()).filter(u => u.length > 0) // <--- Convert ke array
    }

    if (isEditing.value) {
      await updateProduct(selectedProductId.value, payload)
      message.value = { text: 'Produk berhasil diperbarui!', type: 'success' }
    } else {
      await addProduct(payload)
      message.value = { text: 'Produk berhasil ditambahkan!', type: 'success' }
    }
    
    await loadProducts()
    setTimeout(() => {
      currentView.value = 'list'
      resetForm()
      message.value = { text: '', type: '' }
    }, 1500)
  } catch (error) {
    console.error('Error saving product:', error)
    message.value = { text: error.message || 'Gagal menyimpan produk.', type: 'error' }
  } finally {
    loading.value = false
  }
}
// Excel Handlers
const excelInput = ref(null)
const importLoading = ref(false)

const triggerExcelUpload = () => {
  excelInput.value?.click()
}

const handleExcelUpload = async (event) => {
  const target = event.target;
  const file = target.files?.[0];
  if (!file) return;

  importLoading.value = true;
  message.value = { text: '', type: '' };

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('File Excel kosong atau tidak memiliki data.');
      }

      // Map excel keys ke column payload
      const productsData = jsonData.map((row) => ({
        title: row.Title || row.title,
        sub_title: row['Sub Title'] || row.sub_title || '',
        description: row.Description || row.description || '',
        category: row.Category || row.category || '',
        image_url: row['Image URL (Thumbnail)'] || row['Image URL'] || row.image_url || '',
        price: row.Price !== undefined ? Number(row.Price) : (row.price !== undefined ? Number(row.price) : null),
        stock: row.Stock !== undefined ? Number(row.Stock) : (row.stock !== undefined ? Number(row.stock) : null),
        rate: row.Rate !== undefined ? Number(row.Rate) : (row.rate !== undefined ? Number(row.rate) : null),
        images: row['Images (Gallery)'] 
          ? row['Images (Gallery)'].split(',').map((u) => u.trim()) 
          : (row.Images ? row.Images.split(',').map((u) => u.trim()) : [])
      }));

      await addProduct(productsData);

      message.value = { text: `Berhasil mengimpor ${productsData.length} produk!`, type: 'success' };
      await loadProducts();
    } catch (error) {
      console.error('Error importing excel:', error);
      message.value = { text: 'Gagal mengimpor excel: ' + error.message, type: 'error' };
    } finally {
      importLoading.value = false;
      if (excelInput.value) excelInput.value.value = ''; // Reset
    }
  };

  reader.readAsArrayBuffer(file);
}

const downloadTemplate = () => {
  const headers = [['Title', 'Sub Title', 'Description', 'Category', 'Price', 'Stock', 'Rate', 'Image URL (Thumbnail)', 'Images (Gallery)']];
  const worksheet = XLSX.utils.aoa_to_sheet(headers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Produk");
  XLSX.writeFile(workbook, "template_produk.xlsx");
}
// Bulk Delete Handlers
const selectedProducts = ref([])

const isAllSelected = computed({
  get: () => products.value.length > 0 && selectedProducts.value.length === products.value.length,
  set: (val) => {
    if (val) {
      selectedProducts.value = products.value.map(p => p.id)
    } else {
      selectedProducts.value = []
    }
  }
})

const handleBulkDelete = async () => {
  if (selectedProducts.value.length === 0) return;
  if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedProducts.value.length} produk terpilih?`)) return;

  loading.value = true;
  try {
    await deleteProduct(selectedProducts.value);
    selectedProducts.value = []; // Clear selection
    message.value = { text: 'Produk berhasil dihapus secara massal!', type: 'success' };
    await loadProducts();
  } catch (error) {
    console.error('Error bulk deleting:', error);
    message.value = { text: 'Gagal menghapus secara massal: ' + error.message, type: 'error' };
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div v-if="user" class="page-container">
    <div class="ambient-glow"></div>
    
    <header class="header-section fade-in">
      <div class="header-left">
        <NuxtLink to="/" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Kembali ke Beranda
        </NuxtLink>
        <h1 class="page-title"><span class="gradient-text">Admin</span> Dashboard</h1>
      </div>
      <div class="header-actions">
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </header>

    <main class="main-content fade-in">
      <!-- Global Message Box -->
      <div v-if="message.text" :class="['message-box', message.type, 'global-message']">
        {{ message.text }}
      </div>

      <!-- List View -->
      <div v-if="currentView === 'list'" class="view-container">
        <div class="view-header">
          <h2 class="section-title">Daftar Produk</h2>
          <div class="header-buttons">
            <button @click="downloadTemplate" class="download-btn">
              📥 Template Excel
            </button>
            <button @click="triggerExcelUpload" class="import-btn" :disabled="importLoading">
              <span v-if="importLoading">Importing...</span>
              <span v-else>📊 Import Excel</span>
            </button>
            <button @click="openAddForm" class="add-btn">
              + Tambah Produk
            </button>
          </div>
          <input type="file" ref="excelInput" @change="handleExcelUpload" class="hidden-input" accept=".xlsx,.xls,.csv" />
        </div>

        <div v-if="productsPending" class="loading-state">
          <p>Memuat produk...</p>
        </div>

        <div v-else-if="products.length > 0">
          <!-- Bulk Actions Toolbar -->
          <div class="bulk-actions-toolbar glass">
            <div class="toolbar-left">
              <label class="checkbox-container">
                <input type="checkbox" v-model="isAllSelected" />
                <span class="checkmark"></span>
                <span class="label-text">Pilih Semua ({{ selectedProducts.length }})</span>
              </label>
            </div>
            <div class="toolbar-right">
              <button v-if="selectedProducts.length > 0" @click="handleBulkDelete" class="delete-bulk-btn" :disabled="loading">
                ❌ Hapus Terpilih
              </button>
            </div>
          </div>

          <div class="products-list glass">
            <div v-for="product in products" :key="product.id" class="product-item">
              <div class="select-checkbox">
                <label class="checkbox-container">
                  <input type="checkbox" :value="product.id" v-model="selectedProducts" />
                  <span class="checkmark"></span>
                </label>
              </div>
              <div class="product-img">
              <img :src="product.image_url || 'https://via.placeholder.com/60'" alt="Product Image" />
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="product-category">{{ product.category || 'Tanpa Kategori' }}</p>
            </div>
            <div class="product-price">
              IDR {{ product.price ? product.price.toLocaleString() : '-' }}
            </div>
            <div class="product-actions">
              <button @click="openEditForm(product)" class="edit-btn">Edit</button>
              <button @click="handleDelete(product.id)" class="delete-btn" :disabled="loading">Hapus</button>
            </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state glass">
          <p>Belum ada produk.</p>
        </div>
      </div>

      <!-- Form View (Add/Edit) -->
      <div v-else class="view-container">
        <div class="form-wrapper glass">
          <div class="form-header">
            <h2 class="form-title">{{ isEditing ? 'Edit Produk' : 'Tambah Produk' }}</h2>
            <button @click="currentView = 'list'; resetForm();" class="cancel-link">Batal</button>
          </div>

          <!-- Message box moved to global -->

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
              <button type="button" @click="currentView = 'list'; resetForm();" class="reset-btn" :disabled="loading">
                Kembali
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-container {
  padding: 40px 20px 80px 20px;
  position: relative;
  min-height: 100vh;
}

.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 100%);
  filter: blur(60px);
  z-index: -1;
  pointer-events: none;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 8px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #6366f1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logout-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8fafc;
}

.add-btn {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.add-btn:hover {
  transform: translateY(-1px);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s;
}

.product-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.product-img img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  background: #141b2d;
}

.product-info {
  flex: 1;
}

.product-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 4px;
}

.product-category {
  font-size: 0.8rem;
  color: #94a3b8;
}

.product-price {
  font-weight: 600;
  color: #6366f1;
  font-size: 0.95rem;
}

.edit-btn {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.edit-btn:hover {
  background: rgba(99, 102, 241, 0.2);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4468;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.delete-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-actions {
  display: flex;
  gap: 8px;
}

/* Form Styles */
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.cancel-link {
  background: none;
  color: #94a3b8;
  padding: 0;
  font-size: 0.9rem;
}

.form-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8fafc;
}

.message-box {
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 0.9rem;
}

.message-box.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.message-box.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4468;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.85rem;
  color: #cbd5e1;
}

.required {
  color: #ef4444;
}

input, textarea {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 10px 14px;
  color: #f8fafc;
  font-size: 0.9rem;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #6366f1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-grid.three-cols {
  grid-template-columns: 1fr 1fr 1fr;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.form-actions button {
  padding: 12px;
  border-radius: 12px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
  flex: 1;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .product-item {
    display: grid;
    grid-template-columns: 50px 1fr;
    gap: 12px;
    align-items: center;
    position: relative;
  }
  
  .product-info {
    grid-column: 2 / -1;
  }

  .product-price {
    grid-column: 2 / -1;
    text-align: left;
    margin-top: -4px;
    font-size: 0.9rem;
  }

  .product-actions {
    grid-column: span 2;
    width: 100%;
    justify-content: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.03);
    padding-top: 8px;
    margin-top: 4px;
  }

  .form-grid { grid-template-columns: 1fr; }
  .form-grid.three-cols { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column; }
  .header-section { flex-direction: column; align-items: flex-start; gap: 16px; }
  .header-actions { align-self: flex-end; }
}
.header-buttons {
  display: flex;
  gap: 12px;
}

.import-btn {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.import-btn:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.2);
  transform: translateY(-1px);
}

.import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}
.download-btn {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.download-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  transform: translateY(-1px);
}
/* Bulk Delete Styles */
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

.select-checkbox {
  display: flex;
  align-items: center;
  padding-right: 12px;
}
</style>
