<script setup>
const user = useSupabaseUser()
const router = useRouter()

// Watch perubahan status user (ketika Supabase selesai memproses token di URL)
watch(user, (newUser) => {
  if (newUser) {
    const isAdmin = newUser.user_metadata?.role === 'admin'
    
    if (isAdmin) {
      console.log('[Auth Callback] Admin terdeteksi, mengarahkan ke /admin')
      router.push('/admin')
    } else {
      console.log('[Auth Callback] User biasa terdeteksi, mengarahkan ke /')
      router.push('/')
    }
  }
}, { immediate: true })

onMounted(() => {
  console.log('[Auth Callback] page mounted. Menunggu sesi...')
  
  // Timeout Guard: Jika dalam 5 detik tidak login, kembalikan ke /login
  setTimeout(() => {
    if (!user.value) {
      console.log('[Auth Callback] Sesi tidak kunjung terisi, kembali ke /login')
      router.push('/login')
    }
  }, 5000)
})
</script>

<template>
  <div class="callback-container">
    <div class="loading-spinner"></div>
    <p>Memproses autentikasi... Mohon tunggu.</p>
  </div>
</template>

<style scoped>
.callback-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 16px;
  color: #f8fafc;
  background: #0f172a;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
