-- Migration: Update embedding dimension from 512 to 768
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old match_products function (if it exists)
DROP FUNCTION IF EXISTS match_products;

-- Step 2: Alter the products table to change embedding dimension
ALTER TABLE products 
ALTER COLUMN embedding TYPE vector(768);

-- Step 3: Recreate the match_products function with new dimension
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.15,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  name text,
  image_url text,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    name,
    image_url,
    created_at,
    1 - (embedding <=> query_embedding) AS similarity
  FROM products
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Step 4: Verify the change
SELECT 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'embedding';

-- Expected output: vector(768)
