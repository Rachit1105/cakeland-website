'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../../utils/supabase';
import { getThumbnailUrl } from '../../../utils/imageHelpers';
import AdminHeader from '../_components/AdminHeader';

type Product = {
    id: string;
    name: string;
    image_url: string;
    thumbnail_url?: string | null;
    created_at: string;
};

export default function AdminGalleryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [isMobile, setIsMobile] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch products
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle image load complete
    const handleImageLoad = (productId: string) => {
        setLoadedImages(prev => new Set([...prev, productId]));
    };

    // Selection handlers
    const toggleSelection = (productId: string) => {
        setSelectedIds(prev => {
            const updated = new Set(prev);
            if (updated.has(productId)) {
                updated.delete(productId);
            } else {
                updated.add(productId);
            }
            return updated;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(products.map(p => p.id)));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    // Long press for mobile - enters selection mode
    const handleTouchStart = (productId: string, e: React.TouchEvent) => {
        // Prevent context menu from appearing
        e.preventDefault();

        // If already in selection mode (selectedIds > 0), don't set timer
        if (selectedIds.size > 0) {
            return; // Just tap will handle it
        }

        const timer = setTimeout(() => {
            toggleSelection(productId);
        }, 600); // 600ms long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = (productId: string) => {
        if (longPressTimer) {
            // Cancel long press if finger lifted too early
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        } else if (selectedIds.size > 0) {
            // In selection mode - tap toggles selection (any image)
            toggleSelection(productId);
        }
    };

    // Delete handler
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch('/api/admin/delete-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: Array.from(selectedIds) })
            });

            const result = await response.json();

            if (response.ok) {
                // Refresh products and clear selection
                await fetchProducts();
                setSelectedIds(new Set());
                setShowDeleteModal(false);
                alert(`Successfully deleted ${result.results.filter((r: any) => r.success).length} images`);
            } else {
                alert('Failed to delete some images. Please try again.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred during deletion.');
        } finally {
            setDeleting(false);
        }
    };

    // Device-specific eager loading (like explore page)
    const eagerLoadCount = isMobile ? 10 : 20;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AdminHeader />
                <div className="max-w-7xl mx-auto p-6">
                    <h1 className="text-3xl font-bold mb-6">Image Gallery</h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AdminHeader />
                <div className="max-w-7xl mx-auto p-6">
                    <h1 className="text-3xl font-bold mb-6">Image Gallery</h1>
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No images uploaded yet.</p>
                        <a href="/admin" className="text-pink-600 hover:underline mt-4 inline-block">
                            Upload your first images →
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader />

            <div className="max-w-7xl mx-auto p-6">
                {/* Header with selection controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold">Image Gallery</h1>

                    <div className="flex items-center gap-3">
                        {selectedIds.size > 0 && (
                            <>
                                <span className="text-sm text-gray-600">
                                    {selectedIds.size} selected
                                </span>
                                <button
                                    onClick={deselectAll}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium"
                                >
                                    Deselect All
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                                >
                                    Delete ({selectedIds.size})
                                </button>
                            </>
                        )}
                        {selectedIds.size === 0 && (
                            <button
                                onClick={selectAll}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
                            >
                                Select All
                            </button>
                        )}
                    </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product, index) => {
                        const isSelected = selectedIds.has(product.id);
                        const isLoaded = loadedImages.has(product.id);

                        return (
                            <div
                                key={product.id}
                                className="relative aspect-square cursor-pointer group"
                                onClick={() => !isMobile && toggleSelection(product.id)}
                                onTouchStart={(e) => isMobile && handleTouchStart(product.id, e)}
                                onTouchEnd={() => isMobile && handleTouchEnd(product.id)}
                                onTouchCancel={() => isMobile && handleTouchEnd(product.id)}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                {/* Shimmer skeleton while loading */}
                                {!isLoaded && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-lg"></div>
                                )}

                                {/* Image - Using pre-made thumbnail (no transformations!) */}
                                <Image
                                    src={getThumbnailUrl(product.image_url, product.thumbnail_url)}
                                    alt={product.name}
                                    fill
                                    className={`object-cover rounded-lg transition-all ${isSelected ? 'ring-4 ring-blue-500 opacity-80' : 'group-hover:opacity-90'
                                        } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                    loading={index < eagerLoadCount ? 'eager' : 'lazy'}
                                    onLoad={() => handleImageLoad(product.id)}
                                />

                                {/* Selection checkmark */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                                        ✓
                                    </div>
                                )}

                                {/* Filename overlay on hover */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs truncate">{product.name}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{selectedIds.size}</strong> image{selectedIds.size > 1 ? 's' : ''}?
                            <br />
                            <span className="text-red-600 font-semibold">This action cannot be undone.</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add shimmer animation */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}
