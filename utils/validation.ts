import { z } from "zod";

export const ProductSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, "Judul minimal 3 karakter").max(255),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  image_url: z.string().url("URL gambar tidak valid").optional().or(z.literal("")),
  category: z.string().min(1, "Pilih setidaknya satu kategori"),
  description: z.string().optional(),
  stock: z.number().int().min(0).default(0),
});

export type Product = z.infer<typeof ProductSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  avatar_url: z.string().url().optional(),
  email: z.string().email("Email tidak valid"),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
