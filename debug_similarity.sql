-- TEST: Check actual similarity scores for "alcohol cake" query
-- This helps debug why certain cakes rank higher than expected

SELECT 
    id,
    name,
    1 - (embedding <=> (SELECT embedding FROM products WHERE id = 1)) AS similarity_to_first_cake
FROM products
WHERE embedding IS NOT NULL
ORDER BY similarity_to_first_cake DESC
LIMIT 10;

-- Also check the actual distance values (lower = more similar)
SELECT 
    id,
    name,
    embedding <=> (SELECT embedding FROM products WHERE id = 1) AS cosine_distance
FROM products
WHERE embedding IS NOT NULL
ORDER BY cosine_distance ASC
LIMIT 10;
