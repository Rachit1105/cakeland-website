import { NextResponse } from 'next/server';

const CLIP_API_URL = 'https://rachit1105-clip-embedding-api.hf.space';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrl } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Call Hugging Face CLIP API for image embedding
        const response = await fetch(`${CLIP_API_URL}/embed-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl })
        });

        if (!response.ok) {
            throw new Error(`CLIP API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Return the 768-dimensional embedding
        return NextResponse.json({ embedding: data.embedding });

    } catch (error) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
    }
}