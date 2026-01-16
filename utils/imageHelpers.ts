/**
 * Get thumbnail URL - uses pre-made thumbnail if available, 
 * otherwise falls back to Cloudinary transformation
 * 
 * @param imageUrl - Original image URL
 * @param thumbnailUrl - Pre-made thumbnail URL (optional)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(imageUrl: string, thumbnailUrl?: string | null): string {
    // Use pre-made thumbnail if available (no transformation quota used!)
    if (thumbnailUrl) {
        return thumbnailUrl;
    }

    // Fallback: Check if it's a Cloudinary URL and apply transformation
    if (imageUrl.includes('res.cloudinary.com')) {
        // Use 'c_fill' to fill the space while maintaining aspect ratio
        // ar_1:1 forces square aspect ratio, g_auto finds the best crop area
        return imageUrl.replace('/upload/', '/upload/w_400,h_400,c_fill,g_auto,q_60,f_auto/');
    }

    // Final fallback: return original
    return imageUrl;
}

/**
 * Generate Cloudinary large image URL for modal view
 * Returns original image (no transformations)
 */
export function getLargeImageUrl(imageUrl: string): string {
    // For modal view, always use original high-quality image
    return imageUrl;
}
