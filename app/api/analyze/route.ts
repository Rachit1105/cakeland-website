import { NextResponse } from 'next/server';
import { pipeline, RawImage } from '@xenova/transformers';

class Singleton {
    // FIX: Change task to 'image-feature-extraction' to force image mode
    static task = 'image-feature-extraction' as const;
    static model = 'Xenova/clip-vit-large-patch14';
    static instance: any = null;

    static async getInstance(progress_callback?: Function) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, {
                progress_callback: progress_callback || ((data: any) => {
                    if (data.status === 'progress') {
                        console.log(`Downloading ${data.file}: ${Math.round(data.progress || 0)}%`);
                    }
                }),
            });
        }
        return this.instance;
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrl } = body;

        if (!imageUrl) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

        const embedder = await Singleton.getInstance();

        // 1. Read the image
        const image = await RawImage.read(imageUrl);

        // 2. Analyze (Now safely uses the Image Processor)
        const output = await embedder(image, { pooling: 'mean', normalize: true });

        const embedding = Array.from(output.data);

        return NextResponse.json({ embedding });

    } catch (error) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }
}