# Cakeland Website

AI-powered bakery catalog and admin dashboard built with Next.js. Customers can discover cakes using natural language search (semantic search), and admins can bulk-upload images with auto-generated embeddings.

## Project Highlights

- Semantic cake search using CLIP embeddings (`/explore`)
- Cross-modal image understanding through Hugging Face Space API
- Admin upload pipeline with Cloudinary + Supabase
- Client-side thumbnail generation using HTML5 Canvas API
- Keep-alive endpoint for cron jobs to reduce Hugging Face cold starts
- Elfsight-powered customer reviews section on home page
- Performance-first UX with lazy loading, shimmer skeletons, and infinite scroll

## Basic Website Functionality (User Experience)

### Home Page (`/`)
- 3D-style cake carousel with auto-rotation and touch swipe support
- Quick navigation to Explore, Menu, About, WhatsApp, Instagram, and Call actions
- Feature highlight cards (custom designs, freshness, and trust indicators)
- Embedded Elfsight reviews widget for social proof
- Dedicated fallback reviews UI when widget is intentionally not loaded

### Explore Page (`/explore`)
- Natural-language AI search for cake discovery
- Mobile + desktop responsive product grid
- Infinite scroll with paginated backend loading
- Product modal with zoom controls, swipe navigation, keyboard navigation, and WhatsApp CTA

### Menu Page (`/menu`)
- Clean, scrollable menu viewer using static multi-page menu assets
- Mobile slide-out navigation with URL-synced menu state

### About Page (`/about`)
- Business/about information page (currently lightweight)

### Cake Detail Page (`/cake/[id]`)
- Direct shareable product links for order conversations
- Used in WhatsApp inquiry flow from Explore modal

## Performance & Loading Optimizations

- **Lazy loading strategy:** product thumbnails load lazily after an eager first fold batch
- **Skeleton buffering:** shimmer placeholders during initial grid fetch and per-image loading
- **Progressive fetching:** paginated `/api/products` with intersection-observer based infinite scroll
- **Search debounce:** reduces unnecessary API calls while typing in search input
- **Elfsight loading optimization:** timed/cached script loading with graceful fallback UI
- **Suspense fallbacks:** lightweight page fallback UIs while route state resolves
- **Client-side thumbnail compression:** Canvas-based thumbnail generation before upload to reduce payload size

## Tech Stack

- Next.js 16 (App Router)
- TypeScript + React 19
- Tailwind CSS v4
- Supabase (Postgres + pgvector)
- Cloudinary (image hosting)
- Hugging Face Space (CLIP ViT-Large embedding service, 768-dim vectors)

## Routes Overview

### User Pages
- `/` → home page
- `/explore` → AI semantic search UI
- `/menu` → static menu viewer
- `/about` → about page
- `/cake/[id]` → cake detail page

### Admin Pages
- `/admin/login` → admin authentication
- `/admin` → bulk upload dashboard
- `/admin/gallery` → manage/delete uploaded items

## API Reference

### Internal Next.js API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/search` | `POST` | Converts text query to embedding via Hugging Face, then runs Supabase vector search (`match_products`) |
| `/api/products` | `GET` | Returns paginated products list for catalog/explore views |
| `/api/analyze` | `POST` | Gets 768-dim image embedding for a provided image URL |
| `/api/analyze-image` | `POST` | Alternate image analysis endpoint returning embedding |
| `/api/keep-alive` | `GET` | Pings Hugging Face embedding API (for cron-based keep-alive) |
| `/api/admin/login` | `POST` | Authenticates admin and sets `admin_session` cookie |
| `/api/admin/logout` | `POST` | Clears admin session cookie |
| `/api/admin/upload-cloudinary` | `POST` | Uploads original + thumbnail image (base64 payloads) to Cloudinary |
| `/api/admin/delete-products` | `POST` | Deletes selected products from DB and Cloudinary |

### External APIs/Services Used

#### 1) Hugging Face Space API (CLIP)
Base URL:

`https://rachit1105-clip-embedding-api.hf.space`

Model used:
- `openai/clip-vit-large-patch14` (CLIP ViT-Large, 768-dimensional embeddings)

Used endpoints:
- `POST /embed-text` → text query to embedding (used by `/api/search` and `/api/keep-alive`)
- `POST /embed-image` → image URL to embedding (used by `/api/analyze` and `/api/analyze-image`)

Notes:
- Service may sleep on inactivity (free tier).
- `/api/search` includes timeout handling and returns `503` with a user-friendly wake-up message.

#### 2) Cloudinary Upload API
Used in `/api/admin/upload-cloudinary` and `/api/admin/delete-products`.

- Upload originals: `cakeland/originals`
- Upload thumbnails: `cakeland/thumbnails`
- Delete flow extracts `public_id` from Cloudinary URLs before destroy.

#### 3) Supabase APIs
- Postgres table: `products`
- Vector similarity RPC: `match_products(query_embedding, match_threshold, match_count)`
- Supabase JS client used for reads, inserts, deletes, and RPC calls.

#### 4) HTML5 Canvas API (Client-side)
Used in [utils/imageCompression.ts](utils/imageCompression.ts) for thumbnail generation:

- `document.createElement('canvas')`
- `CanvasRenderingContext2D.drawImage()`
- `canvas.toBlob()`

This runs in browser during admin bulk upload to reduce image size before Cloudinary upload.

## Data Model (Core)

`products` table includes:
- `id` (bigserial)
- `name` (text)
- `image_url` (text)
- `thumbnail_url` (text)
- `embedding` (`vector(768)`)
- `title` (text, optional)
- `tags` (`text[]`, optional)
- `created_at`

DB setup and migrations are in:
- [database/supabase-setup.sql](database/supabase-setup.sql)
- [database/migrations/migration-768-embeddings.sql](database/migrations/migration-768-embeddings.sql)
- [database/migrations/migration-add-tags.sql](database/migrations/migration-add-tags.sql)
- [database/migrations/migration-update-rpc.sql](database/migrations/migration-update-rpc.sql)

## Authentication

- Cookie-based admin auth (`admin_session=true`)
- Middleware protects `/admin/:path*` except `/admin/login`
- Logic is in [middleware.ts](middleware.ts)

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

ADMIN_ID=...
ADMIN_PASSWORD=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

HF_SPACE_URL=https://rachit1105-clip-embedding-api.hf.space
```

## Local Development

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Keep-Alive Cron Job (Important)

To reduce Hugging Face cold starts, schedule a daily ping to:

`https://<your-domain>/api/keep-alive`

Recommended frequency: once every 24 hours.

Detailed guide: [docs/troubleshooting/KEEP_ALIVE_SETUP.md](docs/troubleshooting/KEEP_ALIVE_SETUP.md)

## Search Flow (How AI Works)

1. User enters query in `/explore`.
2. `/api/search` sends query to Hugging Face `/embed-text`.
3. Returned vector is matched against `products.embedding` using pgvector RPC (`match_products`).
4. Results are ranked by cosine similarity and returned to UI.
5. If RPC fails, API falls back to JavaScript cosine similarity over fetched products.

## Troubleshooting

- AI wake-up delays and timeout behavior: [docs/troubleshooting/AI_SEARCH_TROUBLESHOOTING.md](docs/troubleshooting/AI_SEARCH_TROUBLESHOOTING.md)
- Keep-alive setup: [docs/troubleshooting/KEEP_ALIVE_SETUP.md](docs/troubleshooting/KEEP_ALIVE_SETUP.md)

## Deployment

- **Hosting platform:** Vercel
- **Custom domain registrar:** Namecheap
- **Production domain:** https://cakeland.app

---

Built for Cakeland bakery catalog discovery and management.
