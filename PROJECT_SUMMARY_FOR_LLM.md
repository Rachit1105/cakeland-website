# Cakeland Website - Project Summary for LLM Context

## 1. Project Overview
**Cakeland Website** is a **Next.js 16** web application for a bakery business. Its standout feature is **AI-powered semantic search** that lets customers find cakes using natural language descriptions (e.g., "pink unicorn birthday cake") instead of keyword matching. The app uses CLIP embeddings for cross-modal search (text → images).

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.1.1 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | Supabase (PostgreSQL) with `pgvector` extension |
| **Storage** | Supabase Storage (bucket: `menu-photos`) |
| **AI/ML** | CLIP embeddings via Hugging Face Space (`rachit1105-clip-embedding-api.hf.space`) |
| **Other** | React 19, react-icons, lottie-react, sharp (image processing), Cloudinary |

---

## 3. Directory Structure

```
cakeland-website/
├── app/
│   ├── page.tsx              # Homepage with hero carousel
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── explore/page.tsx      # AI-powered cake search (main feature)
│   ├── menu/page.tsx         # Static menu viewer
│   ├── about/page.tsx        # About page (placeholder)
│   ├── cake/[id]/page.tsx    # Individual cake detail page
│   ├── admin/
│   │   ├── page.tsx          # Bulk upload dashboard
│   │   ├── login/page.tsx    # Admin login
│   │   ├── gallery/page.tsx  # Gallery management
│   │   └── _components/      # Admin-specific components
│   └── api/
│       ├── search/route.ts   # Vector similarity search endpoint
│       ├── products/route.ts # Fetch all products
│       ├── analyze/route.ts  # Get CLIP embedding for uploaded image
│       ├── analyze-image/    # Image analysis endpoint
│       ├── admin/            # Admin authentication APIs
│       └── keep-alive/       # HF Space keep-alive ping
├── utils/
│   ├── supabase.ts           # Supabase client setup
│   ├── imageCompression.ts   # Client-side image compression
│   └── imageHelpers.ts       # Thumbnail/URL helpers
├── middleware.ts             # Admin route protection (cookie-based auth)
├── supabase-setup.sql        # Database schema + RPC functions
└── public/                   # Static assets (menu images, icons)
```

---

## 4. Database Schema

**Table: `products`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | `bigserial` | Primary key |
| `name` | `text` | Cake name (from filename) |
| `image_url` | `text` | Full-res image URL from Supabase Storage |
| `thumbnail_url` | `text` | Optional thumbnail URL |
| `embedding` | `vector(768)` | CLIP embedding for semantic search |
| `created_at` | `timestamp` | Upload timestamp |

**RPC Function:** `match_products(query_embedding, threshold, limit)` - Returns products ranked by cosine similarity.

**Index:** `products_embedding_idx` (IVFFlat) for fast vector search.

---

## 5. Core Features

### A. Semantic Search (`/explore`)
1. User enters natural language query (e.g., "chocolate cake with flowers")
2. Query sent to `/api/search` → forwarded to HF CLIP API (`/embed-text`)
3. Returns 768-dim embedding → Supabase `match_products` RPC (cosine similarity)
4. Results displayed with similarity badges (Great/Good/Okay Match)
5. Features: infinite scroll, image modal with swipe navigation, zoom controls

### B. Admin Dashboard (`/admin`)
- **Protected by middleware** (cookie-based session)
- **Bulk Upload:** Select multiple images → Queue-based upload (3 concurrent)
  - Upload to Supabase Storage
  - Send URL to `/api/analyze` → HF CLIP API (`/embed-image`)
  - Store product with name + URL + embedding
- **Gallery Management:** View/delete products

### C. Homepage (`/`)
- Hero section with image carousel (swipe-enabled)
- Contact links (WhatsApp, Instagram, Phone)
- Navigation to Explore, Menu, About pages

### D. Menu Page (`/menu`)
- Simple responsive viewer for static menu images

---

## 6. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/products` | GET | Fetch all products (id, name, urls) |
| `/api/search` | POST | Semantic search with text query |
| `/api/analyze` | POST | Generate CLIP embedding for image URL |
| `/api/admin/login` | POST | Admin authentication |
| `/api/keep-alive` | GET | Ping HF Space to prevent cold starts |

---

## 7. Authentication
- **Cookie-based session** (`admin_session=true`)
- Middleware protects all `/admin/*` routes except `/admin/login`
- Login validates against environment variable `ADMIN_PASSWORD`

---

## 8. Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ADMIN_PASSWORD=...
HF_SPACE_URL=https://rachit1105-clip-embedding-api.hf.space
```

---

## 9. External Dependencies
- **Hugging Face Space:** `rachit1105-clip-embedding-api.hf.space`
  - `/embed-text` - Text to 768-dim vector
  - `/embed-image` - Image URL to 768-dim vector
  - **Critical:** If this service is down, search and uploads will fail

---

## 10. Key Design Patterns
- **Client Components:** All pages use `'use client'` directive
- **URL State Sync:** Product modal state persisted in URL (`?product=ID`)
- **Fallback Search:** If Supabase RPC fails, JS-based cosine similarity on all products
- **Mobile-First:** Responsive navigation, swipe gestures, touch handling

---

This summary should give any LLM complete context to understand, debug, or extend the Cakeland project.
