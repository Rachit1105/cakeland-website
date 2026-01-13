# Cakeland Website - Project Analysis

## 1. Project Overview
**Cakeland Website** is a Next.js application designed for a bakery to showcase products and allow customers to intelligently search for cake designs. The core differentiator is its **AI-powered vector search**, allowing users to find cakes based on semantic meaning (e.g., "red velvet birthday cake for kids") rather than just keyword matching.

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** React Hooks (`useState`, `useEffect`, URL state)
- **Icons:** `react-icons`
- **Animations:** Lottie React, CSS interactions (Swiping, carousels)

### Backend & Database
- **Platform:** Supabase (PostgreSQL)
- **Database Features:** 
  - `pgvector` extension for vector similarity search.
  - `ivfflat` indexing for performance.
- **Storage:** Supabase Storage (Bucket: `menu-photos`) for hosting cake images.
- **API:** Next.js API Routes (Serverless).

### AI & Machine Learning
- **Model:** CLIP (Contrastive Language-Image Pre-training)
- **Hosting:** Hugging Face Spaces (`rachit1105-clip-embedding-api.hf.space`)
- **Function:** 
  - Generates 768-dimensional embeddings for both **Images** (during upload) and **Text** (during search).
  - Enables cross-modal retrieval (Text query -> Image results).

## 3. Core Features & Architecture

### A. Semantic Search (Explore Page)
**Path:** `app/explore/page.tsx`, `app/api/search/route.ts`
1.  **User Input:** User types a query (e.g., "jungle theme cake").
2.  **Embedding Generation:** Backend sends query to external HF CLIP API (`/embed-text`).
3.  **Vector Search:** 
    - Resulting 768-dim vector is sent to Supabase.
    - `match_products` RPC function executes a cosine similarity search against stored product embeddings.
    - **Fallback:** If RPC fails, fetches all products and calculates cosine similarity in Node.js (JavaScript).
4.  **Display:** Results ranked by similarity score.

### B. Admin Dashboard (Product Management)
**Path:** `app/admin/page.tsx`, `app/api/analyze/route.ts`
- **Function:** Bulk upload tool for adding new cakes.
- **Workflow:**
    1.  **Upload:** Image uploaded to Supabase Storage.
    2.  **Analyze:** Public URL sent to Next.js API (`/api/analyze`).
    3.  **Embed:** API forwards URL to HF CLIP API (`/embed-image`).
    4.  **Store:** Returns embedding; Frontend inserts `{name, image_url, embedding}` into `products` table.
- **Queue System:** Client-side concurrency control (processes 3 images at a time).

### C. Digital Menu
**Path:** `app/menu/page.tsx`
- **Function:** Simple, responsive viewer for static menu images.
- **Implementation:** Stacks full-width images vertically.

### D. About Page
**Path:** `app/about/page.tsx`
- **Function:** Placeholder page ("Coming soon...") with site navigation.
- **Status:** Needs content implementation.

### E. Products API
**Path:** `app/api/products/route.ts`
- **Function:** Fetches all products (ID, name, URL) sorted by newest first.
- **Usage:** Initial load on Explore page.

## 4. Database Schema
**Table:** `products`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | Primary Key |
| `name` | `text` | Cake name (derived from filename) |
| `image_url` | `text` | Public URL from Supabase Storage |
| `embedding` | `vector(768)` | CLIP embedding vector |
| `created_at` | `timestamp` | Upload timestamp |

**Indexes:**
- `products_embedding_idx`: IVFFlat index for fast vector search.

**RPC Functions:**
- `match_products`: Accepts a query vector, threshold, and limit; returns similar products.

## 5. Key Dependencies & Risks
> [!WARNING]
> **External AI API Dependency:** The system relies entirely on `rachit1105-clip-embedding-api.hf.space`. 
> - If this API creates a bottleneck or goes down, **Search** and **Admin Uploads** will fail.
> - Current fallback logic handles database errors but not AI API failures.

> [!NOTE]
> **Vector Dimensions:** The project migrated from 512-dim to 768-dim vectors. Ensure all legacy data was re-embedded or the table was cleared, otherwise `match_products` will fail due to dimension mismatch.

## 6. Recent Improvements (Session History)
- **Explore Page:**
  - Implemented URL synchronization (`?product=ID`) for better deep linking.
  - Fixed "Back" button behavior on mobile (closes modal instead of leaving page).
  - Replaced heavy carousel with instant-switch image modal.
  - Added smooth swipe gestures.
- **UI:**
  - General aesthetic polish (Pink/White theme).
  - Responsive navigation bars.

## 7. Future Recommendations
1.  **Error Handling for AI:** Implement a graceful fallback if the HF Space is down (e.g., keyword search on the `name` column).
2.  **Pagination:** Search currently returns top 20 results. Infinite scroll or pagination would scale better.
3.  **Admin Auth:** Recently viewed `admin` page is unprotected client-side. Ensure Row Level Security (RLS) or middleware protects these routes in production.
