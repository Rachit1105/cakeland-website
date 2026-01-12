import { NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';

// We don't want to reload the AI model for every request, so we store it globally.
// This is a "Singleton" pattern.
let embedder: any = null;

async function getEmbedder() {
    if (!embedder) {
        // We download the 'CLIP' model. This model is great at connecting images to text.
        // 'feature-extraction' means "give me the raw numbers describing this image".
        embedder = await pipeline('feature-extraction', 'Xenova/clip-vit-large-patch14');
    }
    return embedder;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrl } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // 1. Load the AI Model
        const generateEmbedding = await getEmbedder();

        // 2. The AI looks at the image from your URL
        // It outputs a "Tensor" (a complex math object).
        const output = await generateEmbedding(imageUrl);

        // 3. Convert the Tensor into a simple list of numbers (JavaScript Array)
        const embedding = Array.from(output.data);

        // 4. Send the numbers back to your frontend
        return NextResponse.json({ embedding });

    } catch (error) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
    }
}