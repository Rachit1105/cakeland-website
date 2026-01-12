-- UPGRADE TO ViT-LARGE MODEL (768 Dimensions)
-- Run this in Supabase SQL Editor

-- 1. Truncate existing data (Incompatible with new model)
TRUNCATE TABLE products;

-- 2. Update vector column to 768 dimensions
ALTER TABLE products 
  ALTER COLUMN embedding TYPE vector(768);

-- 3. Drop existing index (it depends on the old column type)
DROP INDEX IF EXISTS products_embedding_idx;

-- 4. Re-create index for 768 dimensions
CREATE INDEX products_embedding_idx 
  ON products USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 5. Update the search function signature
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(768),
  match_threshold float default 0.15,
  match_count int default 20
)
RETURNS TABLE (
  id bigint,
  name text,
  image_url text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    products.id,
    products.name,
    products.image_url,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
$$;
