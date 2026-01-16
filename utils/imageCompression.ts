/**
 * Image Compression Utility
 * Compresses images client-side using HTML5 Canvas API
 */

export interface CompressionOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number; // 0-1
    outputFormat?: 'jpeg' | 'webp' | 'png';
}

/**
 * Compress an image file to specified dimensions and quality
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed image as Blob
 */
export async function compressImage(
    file: File,
    options: CompressionOptions
): Promise<Blob> {
    const { maxWidth, maxHeight, quality, outputFormat = 'jpeg' } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    `image/${outputFormat}`,
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Convert Blob to base64 data URL
 * @param blob - The blob to convert
 * @returns Promise resolving to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Create a thumbnail from an image file
 * Pre-configured for 400x400 thumbnails at 60% quality
 * @param file - The image file
 * @returns Promise resolving to thumbnail base64 string
 */
export async function createThumbnail(file: File): Promise<string> {
    const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.6,
        outputFormat: 'jpeg'
    });

    return blobToBase64(compressed);
}
