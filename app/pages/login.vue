<script setup>
import { ref } from 'vue'

definePageMeta({
  middleware: [
    async (to, from) => {
      const user = useSupabaseUser()
      if (user.value) {
        return navigateTo('/admin') // Jika sudah login, lempar ke admin
      }
    }
  ]
})

const client = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan password wajib diisi!'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    // Gunakan window.location agar browser sinkronisasi cookie secara penuh
    window.location.href = '/admin'
    return
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Gagal login. Periksa email dan password Anda.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="ambient-glow"></div>
    
    <div class="header-section fade-in">
      <NuxtLink to="/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Kembali ke Katalog
      </NuxtLink>
      <h1 class="page-title"><span class="gradient-text">Admin</span> Access</h1>
      <p class="page-subtitle">Login untuk mengelola katalog produk.</p>
    </div>

    <main class="main-content fade-in">
      <div class="form-wrapper glass">
        <h2 class="form-title">Login</h2>

        <div v-if="errorMessage" class="message-box error">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="admin@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="••••••••"
              required
            />
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="loading" class="submit-btn">
              <span v-if="loading">Logging in...</span>
              <span v-else>Login</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-container {
  margin: 0 auto;
  padding: 80px 20px;
  position: relative;
}

.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%);
  filter: blur(60px);
  z-index: -1;
  pointer-events: none;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  margin-bottom: 20px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #6366f1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: #94a3b8;
  font-size: 1rem;
}

.form-wrapper {
  padding: 32px;
  border-radius: 24px;
  max-width: 450px;
  width: 100%;
  margin: 0 auto;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #f8fafc;
  text-align: center;
}

.message-box {
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 0.95rem;
  text-align: center;
}

.message-box.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4468;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #cbd5e1;
}

input {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f8fafc;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
  width: 100%;
}

input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.form-actions {
  margin-top: 12px;
}

button {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.submit-btn {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
