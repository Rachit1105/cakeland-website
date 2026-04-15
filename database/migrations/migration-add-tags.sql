-- Add tags and title columns to the products table
alter table products 
add column tags text[] default array[]::text[],
add column title text;

-- Add comment for clarity
comment on column products.tags is 'AI-generated semantic tags for the image';
comment on column products.title is 'AI-generated display title (e.g., Cricket Theme • Birthday Cake)';
