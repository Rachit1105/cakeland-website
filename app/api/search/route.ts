import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

const CLIP_API_URL = 'https://rachit1105-clip-embedding-api.hf.space';

export async function POST(request: Request) {
    try {
        console.log('Search API called');
        const body = await request.json();
        const { query } = body;

        if (!query || query.trim() === '') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Generate embedding for the search query using Hugging Face CLIP API
        console.log('Calling CLIP API for query:', query);
        const clipResponse = await fetch(`${CLIP_API_URL}/embed-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: query })
        });

        if (!clipResponse.ok) {
            throw new Error(`CLIP API error: ${clipResponse.statusText}`);
        }

        const { embedding } = await clipResponse.json();
        const queryEmbedding: number[] = embedding;

        // 2. Search for similar products using pgvector
        console.log('Searching for query:', query);
        // Using RPC function for vector similarity search
        const { data: products, error } = await supabase.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.0,  // DEBUG: Set to 0.0 to see EVERYTHING
            match_count: 20
        });

        if (products) {
            console.log(`\n========== SEARCH RESULTS for "${query}" ==========`);
            console.log(`Found ${products.length} total matches`);
            console.log('\nRanked by similarity (highest first):');
            products.forEach((p: any, idx: number) => {
                console.log(`  ${idx + 1}. [${(p.similarity * 100).toFixed(1)}%] ${p.name} (ID: ${p.id})`);
            });
            console.log('===============================================\n');
        }

        if (error) {
            console.error('Database search error:', error);
            // Fallback: try direct query if RPC doesn't exist
            const { data: allProducts, error: fallbackError } = await supabase
                .from('products')
                .select('*')
                .not('embedding', 'is', null);

            if (fallbackError) {
                throw new Error(`Database error: ${fallbackError.message}`);
            }

            // Calculate cosine similarity in JavaScript
            const results = allProducts
                .map((product: any) => {
                    const productEmbedding = product.embedding as number[];
                    const similarity = cosineSimilarity(queryEmbedding, productEmbedding);
                    return {
                        ...product,
                        similarity
                    };
                })
                .filter((p: any) => p.similarity > 0.15)  // Lowered from 0.3
                .sort((a: any, b: any) => b.similarity - a.similarity)
                .slice(0, 20);

            return NextResponse.json({ products: results });
        }

        return NextResponse.json({
            products,
            debug: {
                query,
                totalResults: products.length,
                topScore: products[0]?.similarity,
                bottomScore: products[products.length - 1]?.similarity,
                scoresPreview: products.slice(0, 5).map((p: any) => ({
                    name: p.name,
                    similarity: p.similarity
                }))
            }
        });


    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json({
            error: 'Search failed',
            details: error.message
        }, { status: 500 });
    }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
