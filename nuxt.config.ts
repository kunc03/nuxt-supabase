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
  ],

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
