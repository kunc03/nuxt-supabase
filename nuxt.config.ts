import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: [
    "~/assets/css/main.css",
  ],

  modules: [
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "@nuxt/image",
    "@nuxtjs/seo",
    "@vueuse/motion/nuxt",
  ],

  image: {
    format: ["webp", "avif"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  site: {
    url: "https://your-domain.com", // Ganti dengan domain asli nanti
    name: "Glassmorphism Product Catalog",
    description: "Katalog produk modern dengan Nuxt 4 dan Supabase",
    defaultLocale: "id",
  },

  supabase: {
    redirect: false, // Kita handle redirect manual di client
    cookieOptions: {
      secure: false, // Mengizinkan cookie disimpan di HTTP (penting untuk IP lokal)
    }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: "Glassmorphism Product Catalog",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
  },
});
