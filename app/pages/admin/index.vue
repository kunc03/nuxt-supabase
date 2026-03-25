<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import useApi from '~/../composables/useApi'
import * as XLSX from 'xlsx' // <--- Membaca file excel

const user = useSupabaseUser()
const client = useSupabaseClient()
const router = useRouter()
const { fetchProducts, addProduct, updateProduct, deleteProduct } = useApi()

let channel = null

// Auth Guard & Realtime Setup
onMounted(() => {
  if (!user.value) {
    router.push('/login')
    return
  }

  // Realtime subscription
  channel = client
    .channel('public:products-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      // If view is list, reloading is good.
      loadProducts() 
    })
    .subscribe()
})

onUnmounted(() => {
  if (channel) {
    client.removeChannel(channel)
  }
})

const products = ref([])
const productsPending = ref(true)
const currentView = ref('list') // 'list' or 'form'
const currentPage = ref(1)
const itemsPerPage = ref(10) // 10 items per page for admin dashboard

const totalPages = computed(() => {
  return Math.ceil(products.value.length / itemsPerPage.value)
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return products.value.slice(start, end)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
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

// Confirmation Modal States
const isDeleteModalOpen = ref(false)
const isBulkDeleteModalOpen = ref(false)
const productToDeleteId = ref(null)

const loadProducts = async () => {
  productsPending.value = true
  try {
    products.value = await fetchProducts()
  } catch (error) {
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

const handleDelete = (id) => {
  productToDeleteId.value = id
  isDeleteModalOpen.value = true
}

const confirmDeleteProduct = async () => {
  if (!productToDeleteId.value) return

  loading.value = true
  message.value = { text: '', type: '' }

  try {
    await deleteProduct(productToDeleteId.value)
    message.value = { text: 'Produk berhasil dihapus!', type: 'success' }
    await loadProducts()
    setTimeout(() => {
      message.value = { text: '', type: '' }
    }, 2000)
  } catch (error) {
    message.value = { text: 'Gagal menghapus produk: ' + error.message, type: 'error' }
  } finally {
    loading.value = false
    isDeleteModalOpen.value = false
    productToDeleteId.value = null
  }
}

const handleFormSubmit = async (payload) => {
  loading.value = true
  message.value = { text: '', type: '' }

  try {
    const formattedPayload = {
      ...payload,
      price: payload.price !== null && payload.price !== '' && payload.price !== undefined ? Number(payload.price) : null,
      stock: payload.stock !== null && payload.stock !== '' && payload.stock !== undefined ? Number(payload.stock) : null,
      rate: payload.rate !== null && payload.rate !== '' && payload.rate !== undefined ? Number(payload.rate) : null,
      images: payload.imagesText ? payload.imagesText.split('\n').map(u => u.trim()).filter(u => u.length > 0) : []
    }
    delete formattedPayload.imagesText // Remove local UI attribute

    if (isEditing.value) {
      await updateProduct(selectedProductId.value, formattedPayload)
      message.value = { text: 'Produk berhasil diperbarui!', type: 'success' }
    } else {
      await addProduct(formattedPayload)
      message.value = { text: 'Produk berhasil ditambahkan!', type: 'success' }
    }
    
    await loadProducts()
    setTimeout(() => {
      currentView.value = 'list'
      resetForm()
      message.value = { text: '', type: '' }
    }, 1500)
  } catch (error) {
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

const handleBulkDelete = () => {
  if (selectedProducts.value.length === 0) return
  isBulkDeleteModalOpen.value = true
}

const confirmBulkDelete = async () => {
  loading.value = true
  try {
    await deleteProduct(selectedProducts.value)
    selectedProducts.value = [] // Clear selection
    message.value = { text: 'Produk berhasil dihapus secara massal!', type: 'success' }
    await loadProducts()
  } catch (error) {
    message.value = { text: 'Gagal menghapus secara massal: ' + error.message, type: 'error' }
  } finally {
    loading.value = false
    isBulkDeleteModalOpen.value = false
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
          <OrganismsBulkActionsToolbar 
            v-model="isAllSelected" 
            :selectedCount="selectedProducts.length" 
            :loading="loading" 
            @delete="handleBulkDelete" 
          />

          <div class="products-list glass">
            <div v-for="product in paginatedProducts" :key="product.id" class="product-item">
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

          <!-- Pagination Controls -->
          <MoleculesAppPagination 
            v-if="totalPages > 1" 
            v-model="currentPage" 
            :totalPages="totalPages" 
          />
        </div>

        <div v-else class="empty-state glass">
          <p>Belum ada produk.</p>
        </div>
      </div>

      <div v-else class="view-container">
        <OrganismsProductForm 
          :isEditing="isEditing" 
          :initialForm="form" 
          :initialImagesText="imagesText" 
          :loading="loading" 
          @submit="handleFormSubmit" 
          @cancel="currentView = 'list'; resetForm();" 
        />
      </div>
    </main>

    <!-- Confirmation Modals -->
    <MoleculesConfirmModal 
      v-model="isDeleteModalOpen"
      title="Hapus Produk"
      message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
      confirmText="Hapus"
      :loading="loading"
      @confirm="confirmDeleteProduct"
    />

    <MoleculesConfirmModal 
      v-model="isBulkDeleteModalOpen"
      title="Hapus Massal"
      :message="`Apakah Anda yakin ingin menghapus ${selectedProducts.length} produk terpilih?`"
      confirmText="Hapus"
      :loading="loading"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>

<style scoped src="~/assets/css/pages/admin.css"></style>
