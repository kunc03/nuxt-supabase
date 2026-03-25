<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import useApi from '~/../composables/useApi'
import * as XLSX from 'xlsx' // <--- Membaca file excel

const user = useSupabaseUser()
const client = useSupabaseClient()
const router = useRouter()
const { fetchProducts, addProduct, updateProduct, deleteProduct, fetchLogs, searchAi, generateEmbedding } = useApi()

let channel = null

// Auth Guard & Realtime Setup
onMounted(() => {
  const hasAuthCallback = window.location.hash.includes('access_token') || window.location.hash.includes('error')

  if (!user.value && !hasAuthCallback) {
    router.push('/login')
    return
  }

  if (user.value) {
    // Validasi Role Admin
    if (user.value.user_metadata?.role !== 'admin') {
      router.push('/')
      return
    }
    loadProducts()
  }

  channel = client
    .channel('public:products-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      loadProducts() 
    })
    .subscribe()
})

watch(user, (newUser) => {
  if (newUser) {
    // Validasi Role Admin
    if (newUser.user_metadata?.role !== 'admin') {
      router.push('/')
      return
    }
    
    // Beri jeda sedikit untuk memastikan header session sudah sinkron
    setTimeout(() => {
      loadProducts()
    }, 200)
  } else {
    const hasAuthCallback = window.location.hash.includes('access_token') || window.location.hash.includes('error')
    if (!hasAuthCallback) {
      router.push('/login')
    }
  }
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

// Statistika Dashboard
const stats = ref({
  total_products: 0,
  total_stock_value: 0,
  out_of_stock: 0,
  avg_rating: 0
})

const fetchStats = async () => {
  try {
    const { data, error } = await client.rpc('get_admin_stats')
    if (error) throw error
    if (data) stats.value = data
  } catch (err) {
    console.error('Gagal memuat statistik:', err)
  }
}

const searchQuery = ref('')
const isAiSearchEnabled = ref(false)
let searchTimeout = null

const loadProducts = async () => {
  productsPending.value = true
  try {
    if (isAiSearchEnabled.value && searchQuery.value.trim() !== '') {
      products.value = await searchAi(searchQuery.value)
    } else {
      products.value = await fetchProducts(searchQuery.value)
    }
    await fetchStats() // Tetap ambil statistik
  } catch (error) {
    console.error('Gagal memuat produk:', error)
    message.value = { text: 'Gagal memuat produk: ' + (error.message || error), type: 'error' }
  } finally {
    productsPending.value = false
  }
}

watch(isAiSearchEnabled, () => {
  if (searchQuery.value.trim() !== '') {
    loadProducts()
  }
})

// Watcher untuk pencarian Debounce (mencegah spam request)
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadProducts()
  }, 500)
})

const auditLogs = ref([])
const auditLogsPending = ref(false)

const loadLogs = async () => {
  auditLogsPending.value = true
  try {
    auditLogs.value = await fetchLogs()
  } catch (error) {
    console.error('Gagal memuat log:', error)
  } finally {
    auditLogsPending.value = false
  }
}

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
      try {
        await generateEmbedding(selectedProductId.value, `${formattedPayload.title} ${formattedPayload.description || ''}`)
      } catch (err) { console.error('Gagal generate embedding:', err) }
    } else {
      const newProduct = await addProduct(formattedPayload)
      message.value = { text: 'Produk berhasil ditambahkan!', type: 'success' }
      if (newProduct && newProduct.length > 0) {
        try {
          await generateEmbedding(newProduct[0].id, `${formattedPayload.title} ${formattedPayload.description || ''}`)
        } catch (err) { console.error('Gagal generate embedding:', err) }
      }
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

      <!-- Tabs Navigasi -->
      <div v-if="currentView !== 'form'" class="admin-tabs">
        <button @click="currentView = 'list'" :class="{ active: currentView === 'list' }" class="tab-btn">
          📦 Produk
        </button>
        <button @click="currentView = 'audit_logs'; loadLogs()" :class="{ active: currentView === 'audit_logs' }" class="tab-btn">
          🕒 Log Aktivitas
        </button>
      </div>

      <!-- List View -->
      <div v-if="currentView === 'list'" class="view-container">
        
        <!-- Dashboard Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card glass-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <span class="stat-label">Total Produk</span>
              <span class="stat-value">{{ stats.total_products }}</span>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <span class="stat-label">Estimasi Aset</span>
              <span class="stat-value">Rp {{ stats.total_stock_value?.toLocaleString('id-ID') }}</span>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <span class="stat-label">Stok Habis</span>
              <span class="stat-value" :class="{ 'warning': stats.out_of_stock > 0 }">{{ stats.out_of_stock }}</span>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-info">
              <span class="stat-label">Avg Rating</span>
              <span class="stat-value">{{ stats.avg_rating }}<span class="stat-max">/5</span></span>
            </div>
          </div>
        </div>

        <div class="view-header">
          <div class="view-header-left">
            <h2 class="section-title">Daftar Produk</h2>
            
            <!-- Pencarian AI & Native -->
            <div class="admin-search-box">
              <input 
                v-model="searchQuery" 
                type="text" 
                :placeholder="isAiSearchEnabled ? 'Tanya AI (cth: sepatu lari)...' : 'Cari nama, deskripsi...'" 
                class="admin-search-input" 
                :class="{ 'ai-active': isAiSearchEnabled }"
              />
              <button 
                @click="isAiSearchEnabled = !isAiSearchEnabled" 
                class="ai-toggle-btn" 
                :class="{ active: isAiSearchEnabled }"
                title="Gunakan AI Semantic Search"
              >
                ✨
              </button>
            </div>
          </div>
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
            <div v-for="product in paginatedProducts" :key="product.id" :class="['product-item', { 'is-out-of-stock': product.stock === 0 }]">
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
                <h3 class="product-title">
                  {{ product.title }}
                  <span v-if="product.stock === 0" class="out-of-stock-badge">Habis</span>
                </h3>
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

      <!-- Audit Logs View -->
      <div v-else-if="currentView === 'audit_logs'" class="view-container">
        <div class="view-header">
          <h2 class="section-title">Riwayat Aktivitas</h2>
        </div>
        
        <div class="logs-table-wrapper">
          <table v-if="auditLogs.length > 0" class="logs-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Tabel</th>
                <th>Aksi</th>
                <th>Data Lama</th>
                <th>Data Baru</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in auditLogs" :key="log.id">
                <td>{{ new Date(log.created_at).toLocaleString('id-ID') }}</td>
                <td><code>{{ log.table_name }}</code></td>
                <td>
                  <span :class="['action-badge', log.action.toLowerCase()]">
                    {{ log.action }}
                  </span>
                </td>
                <td>
                  <details v-if="log.old_record" class="json-details">
                    <summary>Lihat Data</summary>
                    <pre class="json-content"><code>{{ JSON.stringify(log.old_record, null, 2) }}</code></pre>
                  </details>
                  <span v-else style="color: #64748b; font-size: 0.8rem;">-</span>
                </td>
                <td>
                  <details v-if="log.new_record" class="json-details">
                    <summary>Lihat Data</summary>
                    <pre class="json-content"><code>{{ JSON.stringify(log.new_record, null, 2) }}</code></pre>
                  </details>
                  <span v-else style="color: #64748b; font-size: 0.8rem;">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-logs">
            <p>Belum ada riwayat aktivitas tercatat.</p>
          </div>
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

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(99, 102, 241, 0.2);
}

.stat-icon {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.stat-value {
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.stat-value.warning {
  color: #f59e0b;
}

.stat-max {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 400;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Out of Stock Indicators */
.product-item.is-out-of-stock {
  opacity: 0.75;
  background: rgba(239, 68, 68, 0.02);
}

.product-item.is-out-of-stock .product-img {
  filter: grayscale(0.5);
}

.out-of-stock-badge {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Admin Search Box */
.view-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.admin-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.admin-search-input {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  padding-right: 36px;
  color: #e2e8f0;
  font-size: 0.85rem;
  width: 240px;
  transition: all 0.2s;
}

.admin-search-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(15, 23, 42, 0.6);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  font-size: 0.9rem;
  opacity: 0.6;
}

.admin-search-input.ai-active {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.1);
}

.ai-toggle-btn {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  padding: 4px 6px;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.ai-toggle-btn:hover {
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.1);
}

.ai-toggle-btn.active {
  opacity: 1;
  background: rgba(168, 85, 247, 0.2);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .view-header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  .admin-search-input {
    width: 100%;
  }
}

/* Admin Tabs */
.admin-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  background: rgba(30, 41, 59, 0.4);
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  width: fit-content;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

/* Audit Logs Table */
.logs-table-wrapper {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  margin-top: 16px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.logs-table th {
  background: rgba(15, 23, 42, 0.6);
  padding: 12px 16px;
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.logs-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: #e2e8f0;
}

.action-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.action-badge.insert { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.action-badge.update { background: rgba(234, 179, 8, 0.15); color: #fde047; }
.action-badge.delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.json-details summary {
  cursor: pointer;
  color: #818cf8;
  font-size: 0.8rem;
}

.json-content {
  background: rgba(15, 23, 42, 0.5);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-width: 400px;
}

.empty-logs {
  padding: 48px;
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}
</style>
