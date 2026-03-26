# Panduan Pembelajaran Fitur Supabase

Proyek ini memanfaatkan berbagai fitur canggih dari Supabase untuk memberikan pengalaman pengguna yang dinamis dan aman. Berikut adalah penjelasan masing-masing fitur yang digunakan:

## 1. Supabase Database (PostgreSQL)
Ini adalah jantung dari aplikasi kita, di mana semua data produk dan keranjang belanja disimpan.
- **Kegunaan**: Untuk menyimpan, mengambil, dan memanipulasi data secara terstruktur menggunakan tabel (seperti `products` dan `carts`).
- **Penerapan**: Digunakan di `useApi.ts` untuk mengambil daftar produk dan di `useCartStore.ts` untuk mengelola item di keranjang belanja (`insert`, `update`, `delete`).

## 2. Supabase Auth
Fitur ini menangani pendaftaran, login, dan keamanan sesi pengguna.
- **Kegunaan**: Memastikan hanya pengguna terautentikasi (telah login) yang dapat menggunakan fitur tertentu, seperti menambahkan barang ke keranjang atau melakukan checkout.
- **Penerapan**: Digunakan di `useCartStore.ts` melalui `client.auth.getUser()` untuk mendapatkan ID unik pengguna (`user_id`) yang diperlukan saat menyimpan data ke database.

## 3. Supabase Realtime (Postgres Changes)
Fitur ini memungkinkan aplikasi untuk "mendengarkan" perubahan langsung di database dan memperbarui UI secara otomatis tanpa perlu me-refresh halaman.
- **Kegunaan**: Memberikan feedback instan jika ada perubahan pada data produk (seperti harga atau stok) oleh admin, sehingga pengguna selalu melihat informasi terbaru.
- **Penerapan**: Diimplementasikan di halaman detail produk (`[id].vue`) menggunakan `.on('postgres_changes', ...)` untuk memantau pembaruan pada tabel `products`.

## 4. Supabase Presence
Fitur ini digunakan untuk melacak kehadiran pengguna di suatu saluran (channel) secara real-time.
- **Kegunaan**: Untuk menampilkan statistik "Sedang melihat" pada detail produk, yang menciptakan nuansa "toko yang ramai" dan meningkatkan kepercayaan pengguna.
- **Penerapan**: Digunakan di `[id].vue` melalui `channel.on('presence', ...)` untuk menghitung berapa banyak pengguna yang sedang aktif melihat halaman produk yang sama.

## 5. Database Webhooks
Fitur ini memungkinkan database untuk mengirimkan sinyal (payload JSON) secara otomatis ke sistem eksternal saat terjadi perubahan data (`INSERT`, `UPDATE`, atau `DELETE`).
- **Kegunaan**: Untuk memicu logika otomatis di luar database, seperti mengirim notifikasi, sinkronisasi data ke sistem lain, atau mencatat log audit.
- **Penerapan**: Dikonfigurasi di dashboard Supabase untuk memicu Edge Function `audit-logger` setiap kali ada tabel kunci yang dimodifikasi.

## 6. Supabase Edge Functions (Deno Runtime)
Ini adalah fungsi serverless yang berjalan di "tepi" (edge) jaringan, sangat dekat dengan pengguna, sehingga sangat cepat.
- **Kegunaan**: Menjalankan logika backend kustom seperti memproses data webhook, integrasi API pihak ketiga (misalnya WhatsApp atau AI), atau mengenkripsi data sensitif.
- **Penerapan**: Contohnya ada di `supabase/functions/audit-logger/index.ts` yang bertugas memproses payload dari webhook dan menyimpannya ke tabel audit.

## 7. PostgreSQL RPC (Remote Procedure Call)
Kadang kita butuh menjalankan fungsi database yang kompleks langsung dari frontend.
- **Kegunaan**: Membungkus logika SQL yang rumit ke dalam satu fungsi yang bisa dipanggil dengan nama yang sederhana dari kode Nuxt.
- **Penerapan**: Sering digunakan untuk fitur seperti pencarian AI (similarity search) atau perhitungan stok yang bersifat atomik.

---
> [!TIP]
> **Mengapa Supabase?**
> Supabase memberikan kecepatan pengembangan yang luar biasa karena kita tidak perlu membangun backend API tradisional. Cukup hubungkan frontend Nuxt ke Supabase, dan kita sudah memiliki database, autentikasi, dan fitur real-time dalam satu paket.
