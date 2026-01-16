-- Cakeland Database Setup
-- Run this in Supabase SQL Editor

-- 1. Enable pgvector extension for AI embeddings
create extension if not exists vector;

-- 2. Create products table
create table if not exists products (
  id bigserial primary key,
  name text not null,
  image_url text not null,
  thumbnail_url text,
  embedding vector(768),  -- CLIP model produces 768-dimensional vectors
  created_at timestamp with time zone default now()
);

-- 3. Create index for fast vector similarity search
-- This dramatically speeds up searches when you have many products
create index if not exists products_embedding_idx 
  on products using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Create optimized search function (optional but recommended)
create or replace function match_products(
  query_embedding vector(768),
  match_threshold float default 0.3,
  match_count int default 20
)
returns table (
  id bigint,
  name text,
  image_url text,
  thumbnail_url text,
  similarity float
)
language sql stable
as $$
  select
    products.id,
    products.name,
    products.image_url,
    products.thumbnail_url,
    1 - (products.embedding <=> query_embedding) as similarity
  from products
  where products.embedding is not null
    and 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
$$;

-- 5. Verify setup
select 
  'Products table' as component,
  count(*) as count
from products;
