# 📘 Rangkuman Pembelajaran Teknologi Modern

Project ini telah diperbarui dengan standar industri terbaru. Berikut adalah penjelasan teknologi yang telah diimplementasikan untuk pembelajaran Anda:

## 1. State Management (Pinia + Persistence)
- **Teknologi**: `Pinia` & `@pinia-plugin-persistedstate/nuxt`.
- **Fungsi**: Mengelola data global (seperti keranjang belanja).
- **Pembelajaran**: Dulu kita menggunakan `useState`. Sekarang kita menggunakan Pinia yang lebih terstruktur. Dengan *persistence*, data keranjang belanja tidak akan hilang meskipun browser di-*refresh* karena disimpan di `localStorage` secara otomatis.
- **File**: `composables/useCartStore.ts`.

## 2. Image Optimization (Nuxt Image)
- **Teknologi**: `@nuxt/image`.
- **Fungsi**: Mengoptimalkan gambar secara otomatis.
- **Pembelajaran**: Menggunakan `<NuxtImg />` alih-alih `<img>`. Nuxt akan otomatis mengubah gambar ke format modern seperti **WebP** atau **AVIF** yang jauh lebih ringan, melakukan *lazy loading*, dan menyediakan *placeholder* saat gambar sedang dimuat.
- **File**: `app/components/ProductCard.vue`.

## 3. Advanced SEO & Meta Tags
- **Teknologi**: `@nuxtjs/seo`.
- **Fungsi**: Meningkatkan visibilitas di mesin pencari dan media sosial.
- **Pembelajaran**: Menggunakan `useSeoMeta()` untuk mendefinisikan judul unik, deskripsi, dan **Open Graph (OG) Tags**. Ini memastikan saat link project dibagikan, akan muncul preview yang cantik (gambar, judul, deskripsi).
- **File**: `app/pages/index.vue`.

## 4. Schema Validation (Zod)
- **Teknologi**: `Zod`.
- **Fungsi**: Memastikan data yang masuk (form/API) sesuai dengan standar yang kita tentukan.
- **Pembelajaran**: Zod memungkinkan kita membuat "kontrak" data. Jika data tidak sesuai (misal: harga negatif atau judul kosong), Zod akan memberikan pesan error yang jelas sebelum data tersebut diproses lebih lanjut.
- **File**: `utils/validation.ts`.

## 5. Micro-Animations (VueUse Motion)
- **Teknologi**: `@vueuse/motion`.
- **Fungsi**: Memberikan kesan hidup dan premium pada aplikasi.
- **Pembelajaran**: Menggunakan directive seperti `v-motion-fade-visible-once` yang membuat elemen muncul perlahan saat pengguna melakukan *scroll*. Ini memberikan pengalaman UX yang jauh lebih halus.
- **File**: `app/components/ProductCard.vue`, `app/pages/index.vue`.

## 6. Zero Bundle Size Components (Nuxt Islands)
- **Teknologi**: `Nuxt Islands` (Server Components).
- **Fungsi**: Merender elemen statis hanya di server.
- **Pembelajaran**: Komponen `.server.vue` tidak mengirimkan JavaScript ke browser pengguna. Ini adalah teknologi "cutting-edge" untuk membuat website super cepat namun tetap interaktif di bagian lain.
- **File**: `app/components/StaticDescription.server.vue`.

---

> [!NOTE]
> Semua teknologi di atas adalah standar yang digunakan di perusahaan teknologi besar saat ini. Memahami cara kerjanya akan sangat membantu dalam karir profesional Anda.
