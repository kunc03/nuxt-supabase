<template>
  <div class="static-description-island glass p-6 rounded-2xl border border-white/20">
    <h3 class="text-xl font-bold text-white mb-4">🚀 Kenapa Memilih Kami? (Server Component)</h3>
    <p class="text-white/70 leading-relaxed">
      Komponen ini dirender sepenuhnya di server menggunakan fitur <strong>Nuxt Islands</strong>. 
      Artinya, tidak ada JavaScript tambahan yang dikirim ke browser untuk merender teks ini, 
      membuat halaman Anda jauh lebih ringan dan cepat (Zero Bundle Size).
    </p>
    <ul class="mt-4 space-y-2 text-white/80">
      <li>✅ Performa Maksimal</li>
      <li>✅ Ramah SEO</li>
      <li>✅ Tanpa Hydration di Sisi Client</li>
    </ul>
  </div>
</template>

<style scoped>
.static-description-island {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
</style>
