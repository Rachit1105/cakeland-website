/**
 * Image URL Helper Utilities
 * 
 * These functions generate Supabase Storage Image Transform URLs
 * to serve optimized images without modifying the originals.
 * 
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

/**
 * Generates a thumbnail URL optimized for grid view
 * - Size: 400x400 (cover mode)
 * - Quality: 60%
 * - Target file size: ~50-100KB
 * 
 * @param imageUrl - Original Supabase storage URL
 * @returns Transformed URL with query parameters
 */
export function getThumbnailUrl(imageUrl: string): string {
    try {
        const url = new URL(imageUrl);

        // CRITICAL: Supabase requires /render/image/ instead of /object/ for transformations
        const transformedPath = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        url.pathname = transformedPath;

        url.searchParams.set('width', '400');
        url.searchParams.set('height', '400');
        url.searchParams.set('resize', 'cover');
        url.searchParams.set('quality', '60');
        return url.toString();
    } catch (error) {
        // If URL parsing fails, return original
        console.error('Failed to parse image URL:', error);
        return imageUrl;
    }
}

/**
 * Generates a large image URL optimized for modal/detail view
 * - Width: 1200px (maintain aspect ratio)
 * - Quality: 75%
 * - Target file size: ~100-200KB
 * 
 * @param imageUrl - Original Supabase storage URL
 * @returns Transformed URL with query parameters
 */
export function getLargeImageUrl(imageUrl: string): string {
    try {
        const url = new URL(imageUrl);

        // CRITICAL: Supabase requires /render/image/ instead of /object/ for transformations
        const transformedPath = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        url.pathname = transformedPath;

        url.searchParams.set('width', '1200');
        url.searchParams.set('resize', 'contain');
        url.searchParams.set('quality', '75');
        return url.toString();
    } catch (error) {
        // If URL parsing fails, return original
        console.error('Failed to parse image URL:', error);
        return imageUrl;
    }
}
