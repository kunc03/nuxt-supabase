# Glassmorphism Product Catalog

A modern product catalog built with **Nuxt** and **Supabase**, featuring a sleek Glassmorphism UI, real-time updates, AI-powered semantic search, and a comprehensive admin dashboard.

## 🚀 Features

-   ✨ **Glassmorphism UI**: Premium visual aesthetics with smooth gradients, backdrop filters, and responsive design.
-   🛍️ **Product Catalog**: Browse, filter, and discover products easily.
-   🔍 **Advanced Search**: Standard text-based search and **AI-driven semantic search** powered by `pgvector` and OpenAI embeddings.
-   ⚡ **Realtime Updates**: Live catalog auto-refresh and dynamic live viewer counters using Supabase Realtime.
-   🔐 **Authentication & Security**: Secure user and admin routing, handled via Supabase Auth with Row Level Security (RLS).
-   🛠️ **Admin Dashboard**: Comprehensive product management (Add, Edit, Delete) with environment-aware form validation and confirmation modals.
-   📁 **Bulk Operations**: Efficient product data entry through Excel-based bulk imports and template downloads.
-   🧩 **Atomic Design**: Highly modular, maintainable UI architecture separated into Atoms, Molecules, and Organisms.
-   ☁️ **Edge Functions**: Custom scalable backend logic for secure product management, bulk operations, and AI vector embeddings.

## 🛠️ Tech Stack

-   **Frontend**: [Nuxt 3](https://nuxt.com/) (Vue 3)
-   **Backend (BaaS)**: [Supabase](https://supabase.com/) (Database, Auth, Edge Functions, Realtime)
-   **Vector Database**: `pgvector` capabilities via PostgreSQL
-   **AI Providers**: OpenAI API (for generating embeddings)
-   **Styling**: Vanilla CSS (Atomic Design, Modern utilities & glassmorphism)

## ⚙️ Setup & Installation

### 1. Clone & Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory and add your credentials:

```bash
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-anon-key"
```

> [!NOTE]
> See `.env.example` for reference. You will also need to configure your Edge Functions with the `OPENAI_API_KEY` for semantic search capabilities.

### 3. Supabase Backend (Local Dev)

If you are using the Supabase CLI for local development:

```bash
# Start local Supabase instance
npx supabase start
```

This will automatically run database migrations from `supabase/migrations` (including pgvector configuration) and initialize the local environment.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

-   `app/pages/`: Nuxt page routes (Catalog, Login, Admin Dashboard).
-   `app/components/`: UI components structured using Atomic Design:
    -   `atoms/`: Basic UI building blocks (e.g., buttons, inputs, labels).
    -   `molecules/`: Simple UI assemblies (e.g., search bars, form groups).
    -   `organisms/`: Complex sections (e.g., product forms, hero sections, bulk action toolbars).
-   `supabase/`: Backend orchestration:
    -   `migrations/`: Database schema setup, RLS policies, and vector configuration.
    -   `functions/`: Deno-based Edge Functions (`products`, `ai-search`, etc.).
-   `composables/`: Shared Vue 3 composables governing API calls, Realtime channels, and application state.

---
