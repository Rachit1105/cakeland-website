import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabase';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract Cloudinary public_id from URL
 * Example: https://res.cloudinary.com/cloud/image/upload/v123/cakeland/originals/filename.jpg
 * Returns: cakeland/originals/filename
 */
function extractPublicId(url: string): string | null {
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { productIds } = await request.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { error: 'Product IDs are required' },
                { status: 400 }
            );
        }

        const results = [];

        // Process each product deletion
        for (const productId of productIds) {
            try {
                // 1. Fetch product to get image URLs
                const { data: product, error: fetchError } = await supabase
                    .from('products')
                    .select('image_url, thumbnail_url')
                    .eq('id', productId)
                    .single();

                if (fetchError || !product) {
                    results.push({
                        id: productId,
                        success: false,
                        error: 'Product not found'
                    });
                    continue;
                }

                const deletionErrors = [];

                // 2. Delete original from Cloudinary
                if (product.image_url && product.image_url.includes('res.cloudinary.com')) {
                    const originalPublicId = extractPublicId(product.image_url);
                    if (originalPublicId) {
                        try {
                            await cloudinary.uploader.destroy(originalPublicId);
                        } catch (error: any) {
                            deletionErrors.push(`Original deletion failed: ${error.message}`);
                        }
                    }
                }

                // 3. Delete thumbnail from Cloudinary
                if (product.thumbnail_url && product.thumbnail_url.includes('res.cloudinary.com')) {
                    const thumbnailPublicId = extractPublicId(product.thumbnail_url);
                    if (thumbnailPublicId) {
                        try {
                            await cloudinary.uploader.destroy(thumbnailPublicId);
                        } catch (error: any) {
                            deletionErrors.push(`Thumbnail deletion failed: ${error.message}`);
                        }
                    }
                }

                // 4. Delete from database (even if Cloudinary deletion had issues)
                const { error: dbError } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);

                if (dbError) {
                    results.push({
                        id: productId,
                        success: false,
                        error: `Database deletion failed: ${dbError.message}`
                    });
                    continue;
                }

                // 5. Success (with warnings if any)
                results.push({
                    id: productId,
                    success: true,
                    warnings: deletionErrors.length > 0 ? deletionErrors : undefined
                });

            } catch (error: any) {
                results.push({
                    id: productId,
                    success: false,
                    error: error.message || 'Unknown error'
                });
            }
        }

        // Return detailed results
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `Deleted ${successCount} of ${productIds.length} images`,
            successCount,
            failedCount,
            results
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'An error occurred during deletion', details: error.message },
            { status: 500 }
        );
    }
}
