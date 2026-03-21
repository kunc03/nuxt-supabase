# Glassmorphism Product Catalog

A modern product catalog built with **Nuxt** and **Supabase**, featuring a sleek Glassmorphism UI and an admin dashboard.

## 🚀 Features

-   ✨ **Glassmorphism UI**: Premium visual aesthetics with smooth gradients and backdrop filters.
-   🛍️ **Product Catalog**: Browse and filter products by category.
-   🔐 **Authentication**: User/Admin login handled via Supabase Auth.
-   🛠️ **Admin Dashboard**: Manage products (Add, Edit, Delete).
-   ⚡ **Edge Functions**: Custom backend logic for product management (CRUD).

## 🛠️ Tech Stack

-   **Frontend**: [Nuxt](https://nuxt.com/) (Vue 3)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **Styling**: Vanilla CSS (Modern utilities & glassmorphism)

## ⚙️ Setup & Installation

### 1. Clone & Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```bash
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-anon-or-service-role-key"
```

> [!NOTE]
> See `.env.example` for reference.

### 3. Supabase Backend (Optional / Local Dev)

If you are using the Supabase CLI for local development:

```bash
# Start local Supabase instance
npx supabase start
```

This will run database migrations from `supabase/migrations` and initialize Edge Functions.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

-   `app/pages/`: Nuxt pages (Catalog, Login, Admin).
-   `supabase/`: Supabase configuration, migrations, and Edge Functions.
-   `composables/`: Shared Vue composables (e.g., `useApi`).

---
