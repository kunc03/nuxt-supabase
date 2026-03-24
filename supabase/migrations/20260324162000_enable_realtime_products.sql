-- Enable Realtime for products table
-- Tahap 1: Tambahkan tabel ke publikasi realtime Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Tahap 2: Set Replica Identity ke FULL agar payload UPDATE mengirimkan semua data kolom (termasuk stok/harga)
ALTER TABLE products REPLICA IDENTITY FULL;
