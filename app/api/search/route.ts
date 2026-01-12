import { NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';
import { supabase } from '../../../utils/supabase';

class TextEmbedder {
    static model = 'Xenova/clip-vit-large-patch14';
    static instance: any = null;
    static processor: any = null;

    static async getInstance() {
        if (this.instance === null) {
            // Import the specific modules we need
            const { AutoTokenizer, CLIPTextModelWithProjection } = await import('@xenova/transformers');

            // Load the tokenizer and text model separately
            this.processor = await AutoTokenizer.from_pretrained(this.model);
            this.instance = await CLIPTextModelWithProjection.from_pretrained(this.model);
        }
        return { model: this.instance, tokenizer: this.processor };
    }
}

export async function POST(request: Request) {
    try {
        console.log('Search API called'); // DEBUG: Verify endpoint is hit
        const body = await request.json();
        const { query } = body;

        if (!query || query.trim() === '') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Generate embedding for the search query using CLIP text encoder
        const { model, tokenizer } = await TextEmbedder.getInstance();

        // Tokenize the text
        const textInputs = await tokenizer(query, { padding: true, truncation: true });

        // Generate embeddings
        const output = await model(textInputs);

        // Get the pooled output and normalize it
        const embedding = output.text_embeds.data;
        const queryEmbedding: number[] = Array.from(embedding) as number[];

        // Normalize the embedding
        const norm = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
        const normalizedEmbedding = queryEmbedding.map(val => val / norm);

        // 2. Search for similar products using pgvector
        console.log('Searching for query:', query);
        // Using RPC function for vector similarity search
        const { data: products, error } = await supabase.rpc('match_products', {
            query_embedding: normalizedEmbedding,
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
                    const similarity = cosineSimilarity(normalizedEmbedding, productEmbedding);
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
