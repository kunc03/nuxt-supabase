<script setup>
import { ref } from 'vue'

definePageMeta({
  middleware: [
    async (to, from) => {
      const user = useSupabaseUser()
      console.log('[Login Guard] User state:', user.value ? 'Logged IN' : 'Logged OUT')
      if (user.value) {
        console.log('[Login Guard] Redirecting to /admin')
        return navigateTo('/admin')
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
const successMessage = ref('')
const loginMethod = ref('password') // 'password' or 'magic_link'

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan password wajib diisi!'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const { error } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    window.location.href = '/admin'
    return
  } catch (error) {
    errorMessage.value = error.message || 'Gagal login. Periksa email dan password Anda.'
  } finally {
    loading.value = false
  }
}

const handleMagicLink = async () => {
  if (!email.value) {
    errorMessage.value = 'Email wajib diisi!'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const { error } = await client.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      }
    })

    if (error) throw error

    successMessage.value = 'Magic Link telah dikirim! Periksa kotak masuk email Anda (Inbucket jika di lokal).'
  } catch (error) {
    errorMessage.value = error.message || 'Gagal mengirim Magic Link.'
  } finally {
    loading.value = false
  }
}

const handleOAuth = async (provider) => {
  errorMessage.value = ''
  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      }
    })
    if (error) throw error
  } catch (error) {
    errorMessage.value = error.message || `Gagal login dengan ${provider}.`
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

        <!-- Tab Controls -->
        <div class="auth-tabs">
          <button @click="loginMethod = 'password'" :class="['tab-btn', { active: loginMethod === 'password' }]">Password</button>
          <button @click="loginMethod = 'magic_link'" :class="['tab-btn', { active: loginMethod === 'magic_link' }]">Magic Link</button>
        </div>

        <div v-if="errorMessage" class="message-box error">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="message-box success">
          {{ successMessage }}
        </div>

        <form @submit.prevent="loginMethod === 'password' ? handleSubmit() : handleMagicLink()" class="login-form">
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

          <div v-if="loginMethod === 'password'" class="form-group">
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
            <button type="submit" :disabled="loading" class="submit-btn" :class="{ 'magic-link-btn': loginMethod === 'magic_link' }">
              <span v-if="loading">{{ loginMethod === 'password' ? 'Logging in...' : 'Sending...' }}</span>
              <span v-else>{{ loginMethod === 'password' ? 'Login' : 'Kirim Magic Link' }}</span>
            </button>
          </div>
        </form>

        <!-- OAuth Section -->
        <div class="oauth-section">
          <div class="divider">
            <span class="divider-text">Atau login dengan</span>
          </div>
          <div class="oauth-grid">
            <button @click="handleOAuth('google')" class="oauth-btn google-btn">
              <!-- Inline Google Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.8 24.5c0-1.61-.15-3.16-.43-4.65H24v9.3h12.8c-.55 2.87-2.18 5.3-4.63 6.94l7.2 5.57c4.21-3.88 6.63-9.59 6.63-15.66z"/><path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59L2.56 13.22C.92 16.5 0 20.15 0 24s.92 7.5 2.56 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.57c-2.11 1.41-4.81 2.25-7.69 2.25-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              <span>Google</span>
            </button>
            <button @click="handleOAuth('github')" class="oauth-btn github-btn">
              <!-- Inline GitHub Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.419-1.304.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>
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

/* Advanced Auth Styles */
.message-box.success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.auth-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  padding: 5px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.oauth-section {
  margin-top: 24px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.divider::before { margin-right: 12px; }
.divider::after { margin-left: 12px; }

.divider-text {
  color: #64748b;
  font-size: 0.85rem;
}

.oauth-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  padding: 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.oauth-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.google-btn:hover { border-color: rgba(234, 67, 53, 0.4); }
.github-btn:hover { border-color: rgba(255, 255, 255, 0.3); }

@media (max-width: 480px) {
  .oauth-grid {
    grid-template-columns: 1fr;
  }
}
</style>
