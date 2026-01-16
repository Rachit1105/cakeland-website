import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const { originalFile, thumbnailFile, filename } = await request.json();

        if (!originalFile || !thumbnailFile || !filename) {
            return NextResponse.json(
                { error: 'Original file, thumbnail file, and filename are required' },
                { status: 400 }
            );
        }

        const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension

        // Upload original to /originals folder
        const originalUpload = await cloudinary.uploader.upload(originalFile, {
            folder: 'cakeland/originals',
            public_id: baseFilename,
            resource_type: 'auto',
            // No transformations - store as-is
        });

        // Upload thumbnail to /thumbnails folder
        const thumbnailUpload = await cloudinary.uploader.upload(thumbnailFile, {
            folder: 'cakeland/thumbnails',
            public_id: `${baseFilename}_thumb`,
            resource_type: 'auto',
            // No transformations - already compressed client-side
        });

        return NextResponse.json({
            success: true,
            originalUrl: originalUpload.secure_url,
            thumbnailUrl: thumbnailUpload.secure_url,
            original: {
                public_id: originalUpload.public_id,
                width: originalUpload.width,
                height: originalUpload.height,
                format: originalUpload.format,
                bytes: originalUpload.bytes
            },
            thumbnail: {
                public_id: thumbnailUpload.public_id,
                width: thumbnailUpload.width,
                height: thumbnailUpload.height,
                format: thumbnailUpload.format,
                bytes: thumbnailUpload.bytes
            }
        });

    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error.message },
            { status: 500 }
        );
    }
}
