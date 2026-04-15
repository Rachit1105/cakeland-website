-- First, drop the existing function (required because return type changed)
DROP FUNCTION IF EXISTS match_products(vector, double precision, integer);

-- Then create the updated version with title and tags
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  name text,
  image_url text,
  thumbnail_url text,
  title text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.image_url,
    products.thumbnail_url,
    products.title,
    products.tags,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
