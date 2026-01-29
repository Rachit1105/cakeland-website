'use client';
import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaHome, FaWhatsapp, FaInstagram, FaBars, FaTimes, FaBook, FaPhone, FaSearch, FaPalette, FaStar, FaBolt } from 'react-icons/fa';
import { getThumbnailUrl, getLargeImageUrl } from '@/utils/imageHelpers';

interface Product {
    id: number;
    name: string;
    image_url: string;
    thumbnail_url?: string | null; // Pre-made thumbnail
    similarity?: number;
    title?: string | null; // AI-generated title
    tags?: string[] | null; // AI-generated tags
}

function ExplorePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
    const [menuOpen, setMenuOpen] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Pagination state for infinite scroll
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);

    // Detect if device is mobile for optimized loading
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Mobile breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Device-specific image loading threshold
    // Mobile: Load 6 images initially, Desktop/Tablet: 8 images
    const eagerLoadCount = isMobile ? 6 : 8;

    // Sync modal AND menu with URL
    useEffect(() => {
        // 1. Sync Product Modal
        const productId = searchParams.get('product');
        if (productId) {
            // Check finding in allProducts OR displayedProducts (for search results)
            const product = allProducts.find(p => p.id === parseInt(productId))
                || displayedProducts.find(p => p.id === parseInt(productId));
            if (product) setSelectedProduct(product);
        } else {
            setSelectedProduct(null);
        }

        // 2. Sync Mobile Menu
        const isMenuOpen = searchParams.get('menu') === 'true';
        setMenuOpen(isMenuOpen);

    }, [searchParams, allProducts]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedProduct]);

    // Handle menu toggle
    const toggleMenu = () => {
        if (menuOpen) {
            router.back();
        } else {
            const params = new URLSearchParams(searchParams.toString());
            params.set('menu', 'true');
            router.push(`?${params.toString()}`);
        }
    };

    // Handle closing menu specifically (e.g. from links)
    const closeMenu = () => {
        if (menuOpen) router.back();
    };

    // Handle product click - update URL
    const handleProductClick = (product: Product) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('product', product.id.toString());
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // Close modal - go back in history to remove param
    const closeModal = () => {
        router.back();
    };

    // Scroll detection for header
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Load all products on mount
    useEffect(() => {
        loadAllProducts();
    }, []);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (isLoading || searchQuery.trim()) return; // Don't set up observer during initial load or search

        const observer = new IntersectionObserver(
            (entries) => {
                // When the sentinel div becomes visible, load more
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMoreProducts();
                }
            },
            {
                threshold: 0.1, // Trigger when 10% of sentinel is visible
                rootMargin: '200px' // Start loading 200px before sentinel comes into view
            }
        );

        const sentinel = document.querySelector('#infinite-scroll-sentinel');
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
            observer.disconnect();
        };
    }, [hasMore, isLoadingMore, isLoading, searchQuery]);

    // Search debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setDisplayedProducts(allProducts);
            setIsSearching(false);
            return;
        }

        // Set searching state immediately when user types
        setIsSearching(true);

        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, allProducts]);

    const loadAllProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/products?page=1&limit=12');
            if (response.ok) {
                const data = await response.json();
                setAllProducts(data.products || []);
                setDisplayedProducts(data.products || []);
                setHasMore(data.hasMore || false);
                setTotalProducts(data.total || 0);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load more products for infinite scroll
    const loadMoreProducts = async () => {
        if (!hasMore || isLoadingMore || searchQuery.trim()) return; // Don't paginate during search

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await fetch(`/api/products?page=${nextPage}&limit=24`);
            if (response.ok) {
                const data = await response.json();
                setAllProducts(prev => [...prev, ...(data.products || [])]);
                setDisplayedProducts(prev => [...prev, ...(data.products || [])]);
                setHasMore(data.hasMore || false);
                setCurrentPage(nextPage);
            }
        } catch (error) {
            console.error('Failed to load more products:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const performSearch = async (query: string) => {
        setIsSearching(true);
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                const data = await response.json();
                setDisplayedProducts(data.products || []);
            } else if (response.status === 503) {
                // AI service is waking up
                const errorData = await response.json();
                console.warn('AI service timeout:', errorData.message);
                alert('🤖 AI Search is waking up!\n\nThe search service was sleeping and needs 30-60 seconds to start. Please try your search again in a moment.');
                setDisplayedProducts(allProducts); // Show all products as fallback
            } else {
                console.error('Search failed with status:', response.status);
                alert('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed. Please check your connection and try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setDisplayedProducts(allProducts);
    };

    const getMatchBadge = (similarity?: number) => {
        if (!similarity) return null;

        const percent = similarity * 100;

        if (percent >= 40) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Perfect Match</span>;
        } else if (percent >= 30) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Great Match</span>;
        } else if (percent >= 20) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Good Match</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Related</span>;
        }
    };

    const openWhatsApp = (cakeName: string, productId: number) => {
        const productUrl = `${window.location.origin}/cake/${productId}`;
        const message = encodeURIComponent(
            `Hi Cakeland 👋🍰\n\n` +
            `I came across this cake design on your website and I'm interested in ordering it.\n` +
            `Reference Link: ${productUrl}\n\n` +
            `Could you please share the available sizes, pricing, and customization options?\n\n` +
            `Looking forward to your reply 😊`
        );
        window.open(`https://wa.me/919883414650?text=${message}`, '_blank');
    };

    // Navigate to next/previous product
    const navigateProduct = async (direction: 'next' | 'prev') => {
        if (!selectedProduct) return;

        const currentIndex = displayedProducts.findIndex(p => p.id === selectedProduct.id);
        let newIndex;

        // Load more products if we are near the end (last 3 items) and going forward
        if (direction === 'next' && currentIndex >= displayedProducts.length - 3 && hasMore && !isLoadingMore && !searchQuery) {
            await loadMoreProducts();
            // Note: navigate will happen with updated displayedProducts in logic below 
            // BUT since state update is async, we can't rely on it immediately in this render cycle using 'displayedProducts'.
            // However, since regular loadMore is effective, we just let the USER hit next again for now, 
            // OR simpler: we don't block navigation, we just fetch in background.
            // The user will see the existing last product, then when they click next, new ones might be there.
        }

        if (direction === 'next') {
            // If we are at the very last item and trying to go next
            if (currentIndex === displayedProducts.length - 1) {
                // If there's more content, load it and STOP wrapping
                if (hasMore && !searchQuery) {
                    await loadMoreProducts();
                    return; // Wait for user to click again or useEffect to handle update (complex), 
                    // simpler: just return and let them click again once loaded. 
                    // Actually, better UX: fetch beforehand (prefetching implemented above).

                    // IF we want to wrap only if NO more content:
                } else if (!hasMore) {
                    newIndex = 0; // Wrap to start only if no more data
                } else {
                    return; // Should not happen if logic is correct
                }
            } else {
                newIndex = currentIndex + 1;
            }
        } else {
            // Previous logic
            if (currentIndex === 0) {
                // wrap to end
                newIndex = displayedProducts.length - 1;
            } else {
                newIndex = currentIndex - 1;
            }
        }

        // Safety check if we found a valid index
        if (newIndex === undefined) return;

        const nextProduct = displayedProducts[newIndex];
        if (!nextProduct) return; // Guard clause

        setSelectedProduct(nextProduct);

        // Update URL without adding to history stack
        const params = new URLSearchParams(searchParams.toString());
        params.set('product', nextProduct.id.toString());
        router.replace(`?${params.toString()}`, { scroll: false });

        setImageZoom(1); // Reset zoom when changing images
        setDragOffset(0); // Reset drag offset
        setIsDragging(false);
        setSlideDirection(direction); // Trigger animation
    };

    // Preload next/prev images when modal is open
    useEffect(() => {
        if (!selectedProduct) return;

        const currentIndex = displayedProducts.findIndex(p => p.id === selectedProduct.id);
        if (currentIndex === -1) return;

        // Calculate next and prev indices
        const nextIndex = (currentIndex + 1) % displayedProducts.length;
        const prevIndex = (currentIndex - 1 + displayedProducts.length) % displayedProducts.length;

        // Preload images
        const preloadImage = (url: string) => {
            const img = new window.Image();
            img.src = getLargeImageUrl(url);
        };

        preloadImage(displayedProducts[nextIndex].image_url);
        preloadImage(displayedProducts[prevIndex].image_url);

    }, [selectedProduct, displayedProducts]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedProduct) return;

            if (e.key === 'Escape') {
                setSelectedProduct(null);
                setImageZoom(1);
            } else if (e.key === 'ArrowRight') {
                navigateProduct('next');
            } else if (e.key === 'ArrowLeft') {
                navigateProduct('prev');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProduct, displayedProducts]);

    // Zoom handlers
    const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 0.5, 1));
    const resetZoom = () => setImageZoom(1);

    // Get adjacent products for carousel
    const getCurrentIndex = () => {
        if (!selectedProduct) return -1;
        return displayedProducts.findIndex(p => p.id === selectedProduct.id);
    };

    const getPrevProduct = () => {
        const currentIndex = getCurrentIndex();
        if (currentIndex === -1) return null;
        const prevIndex = (currentIndex - 1 + displayedProducts.length) % displayedProducts.length;
        return displayedProducts[prevIndex];
    };

    const getNextProduct = () => {
        const currentIndex = getCurrentIndex();
        if (currentIndex === -1) return null;
        const nextIndex = (currentIndex + 1) % displayedProducts.length;
        return displayedProducts[nextIndex];
    };

    // Swipe handlers for modal
    const handleSwipeStart = (clientX: number) => {
        setTouchStart(clientX);
        setTouchEnd(clientX);
        setIsDragging(true);
    };

    const handleSwipeMove = (clientX: number) => {
        if (!isDragging || !touchStart || !selectedProduct) return;

        const currentIndex = displayedProducts.findIndex(p => p.id === selectedProduct.id);
        const diff = clientX - touchStart;

        // Add resistance at boundaries
        if (currentIndex === 0 && diff > 0) {
            // First item, swiping right - add resistance (divide by 3)
            setDragOffset(diff / 3);
        } else if (currentIndex === displayedProducts.length - 1 && diff < 0 && !hasMore) {
            // Last item, swiping left with no more content - add resistance
            setDragOffset(diff / 3);
        } else {
            // Normal swiping - 1:1 tracking
            setDragOffset(diff);
        }

        setTouchEnd(clientX);
    };

    const handleSwipeEnd = () => {
        if (!touchStart || !touchEnd) {
            setIsDragging(false);
            return;
        }

        const distance = touchStart - touchEnd;
        const threshold = 50; // Threshold for triggering navigation
        const currentIndex = getCurrentIndex();

        // Reset drag offset immediately
        setDragOffset(0);

        // If dragged far enough to trigger navigation
        if (Math.abs(distance) > threshold) {
            // Swiping left (going next)
            if (distance > 0) {
                if (currentIndex < displayedProducts.length - 1 || hasMore) {
                    setSlideDirection('next'); // Animate from right
                    navigateProduct('next');
                }
            }
            // Swiping right (going prev)
            else {
                if (currentIndex > 0) {
                    setSlideDirection('prev'); // Animate from left
                    navigateProduct('prev');
                }
            }
        }

        setTouchStart(0);
        setTouchEnd(0);
        setIsDragging(false);
    };

    return (
        <main className="min-h-screen bg-[#fef5f6]">

            {/* Navigation */}
            <nav className={`bg-[#E46296] h-20 md:h-24 sticky top-0 z-40 shadow-md px-2 md:px-10 flex justify-between items-center transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
                }`}>
                <Link href="/" className="flex items-center">
                    <div className="w-44 h-16 md:w-56 md:h-20 relative -ml-2 md:ml-0">
                        <Image
                            src="/Cakeland.png"
                            alt="Cakeland Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-3 md:gap-6 text-white">
                    <Link href="/" className="flex items-center gap-1.5 md:gap-2 font-semibold text-xs md:text-sm tracking-wide hover:underline transition">
                        <FaHome size={14} className="md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <div className="h-4 md:h-6 w-px bg-white/50"></div>
                    <a href="https://wa.me/919883414650" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition">
                        <FaWhatsapp size={20} className="md:w-6 md:h-6" />
                    </a>
                    <a href="https://instagram.com/cakelandkolkata" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition">
                        <FaInstagram size={20} className="md:w-6 md:h-6" />
                    </a>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-3 text-white">
                    <Link href="/" className="font-semibold text-base tracking-wide hover:underline transition flex items-center gap-2">
                        <FaHome size={18} />
                        Home
                    </Link>
                    <div className="h-6 w-px bg-white/50"></div>
                    <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded transition">
                        {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Backdrop */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Slide-out Menu */}
            <div className={`fixed top-20 right-0 w-64 bg-[#E46296] text-white shadow-xl z-30 transition-transform duration-300 md:hidden rounded-bl-2xl ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <nav className="flex flex-col p-6 gap-6">
                    <Link href="/menu" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
                        <FaBook size={20} />
                        <span className="font-semibold">Menu</span>
                    </Link>
                    <div className="h-px bg-white/30"></div>
                    <a href="https://wa.me/919883414650" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
                        <FaWhatsapp size={20} />
                        <span className="font-semibold">WhatsApp</span>
                    </a>
                    <a href="https://instagram.com/cakelandkolkata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
                        <FaInstagram size={20} />
                        <span className="font-semibold">Instagram</span>
                    </a>
                    <div className="h-px bg-white/30"></div>
                    <a href="tel:+919883414650" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
                        <FaPhone size={20} />
                        <span className="font-semibold">Call Us</span>
                    </a>
                </nav>
            </div>

            {/* Search Bar */}
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search for cakes... (e.g., 'birthday', 'chocolate', 'wedding')"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-8 py-5 pr-24 rounded-full bg-white shadow-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E46296]/40 focus:shadow-lg transition-all"
                    />
                    <FaSearch className="absolute right-7 top-1/2 transform -translate-y-1/2 text-[#E46296] text-xl pointer-events-none" />

                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <FaTimes size={20} />
                        </button>
                    )}

                    {isSearching && (
                        <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E46296]"></div>
                        </div>
                    )}
                </div>

                {searchQuery && (
                    <p className="text-center mt-4 text-gray-600">
                        {isSearching ? (
                            <>✨ Searching for cakes with AI...</>
                        ) : (
                            <>Showing {displayedProducts.length} results for "<span className="font-semibold text-[#E46296]">{searchQuery}</span>"</>
                        )}
                    </p>
                )}
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-20">
                {isLoading ? (
                    // Enhanced Skeleton Loading with Shimmer
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]"></div>
                            </div>
                        ))}
                    </div>
                ) : displayedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
                        {displayedProducts
                            .filter(product => !brokenImages.has(product.id))
                            .map((product, index) => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                                >
                                    <div className="aspect-square relative bg-gray-50">
                                        {/* Skeleton while loading */}
                                        {!loadedImages.has(product.id) && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]" />
                                        )}
                                        <Image
                                            src={getThumbnailUrl(product.image_url, product.thumbnail_url)}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            loading={index < eagerLoadCount ? 'eager' : 'lazy'}
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            onLoad={() => {
                                                setLoadedImages(prev => new Set([...prev, product.id]));
                                            }}
                                            onError={() => {
                                                console.error(`Failed to load image for product ${product.id}: ${product.image_url}`);
                                                setBrokenImages(prev => new Set([...prev, product.id]));
                                            }}
                                        />
                                    </div>
                                    {/* Removed product name and match badge from grid */}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No cakes found. Try a different search!</p>
                    </div>
                )}

                {/* Infinite Scroll Sentinel */}
                {!searchQuery.trim() && (
                    <div id="infinite-scroll-sentinel" className="w-full py-8 flex justify-center">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2 text-[#E46296]">
                                <div className="w-6 h-6 border-3 border-[#E46296] border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-semibold">Loading more cakes...</span>
                            </div>
                        )}
                        {!hasMore && allProducts.length > 0 && (
                            <div className="text-gray-500 font-medium">
                                You've seen all {totalProducts} cakes! 🎂
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Product Modal - Premium Spotlight */}
            {
                selectedProduct && (
                    <div
                        className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-0 md:p-6"
                        onClick={() => {
                            closeModal();
                            resetZoom();
                        }}
                    >
                        {/* Modal Container - Split on Desktop, Stacked on Mobile */}
                        <div
                            className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
                            onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                            onTouchEnd={() => handleSwipeEnd()}
                            onMouseDown={(e) => handleSwipeStart(e.clientX)}
                            onMouseMove={(e) => handleSwipeMove(e.clientX)}
                            onMouseUp={() => handleSwipeEnd()}
                            onMouseLeave={() => isDragging && handleSwipeEnd()}
                        >
                            {/* TOP: Image Section */}
                            <div className="group relative w-full aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center">
                                {/* Image with Swipe Support */}
                                <div
                                    key={selectedProduct.id}
                                    className={`relative w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.02] ${slideDirection === 'next' ? 'animate-slide-in-from-right' :
                                        slideDirection === 'prev' ? 'animate-slide-in-from-left' : ''
                                        }`}
                                    style={{
                                        transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
                                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                    }}
                                    onAnimationEnd={() => setSlideDirection(null)}
                                >
                                    <Image
                                        src={getLargeImageUrl(selectedProduct.image_url)}
                                        alt={selectedProduct.name}
                                        fill
                                        className="object-contain"
                                        style={{ transform: `scale(${imageZoom})` }}
                                        sizes="(max-width: 768px) 100vw, 60vw"
                                        priority
                                    />
                                </div>

                                {/* Close Button - Top Right */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeModal();
                                        resetZoom();
                                    }}
                                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center transition z-10 text-gray-700"
                                >
                                    <FaTimes size={18} />
                                </button>

                                {/* Navigation - Left Arrow */}
                                {getCurrentIndex() > 0 && (
                                    <button
                                        onClick={() => navigateProduct('prev')}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center transition text-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}

                                {/* Navigation - Right Arrow */}
                                <button
                                    onClick={() => navigateProduct('next')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center transition text-gray-700"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Zoom Controls - Bottom Left */}
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    <button
                                        onClick={handleZoomIn}
                                        disabled={imageZoom >= 3}
                                        className="w-9 h-9 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center transition disabled:opacity-40 text-gray-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleZoomOut}
                                        disabled={imageZoom <= 1}
                                        className="w-9 h-9 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center transition disabled:opacity-40 text-gray-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                        </svg>
                                    </button>
                                    {imageZoom > 1 && (
                                        <button
                                            onClick={resetZoom}
                                            className="w-9 h-9 bg-white/90 hover:bg-white shadow-sm rounded-full flex items-center justify-center transition text-xs font-semibold text-gray-700"
                                        >
                                            1x
                                        </button>
                                    )}
                                </div>

                            </div>

                            {/* BOTTOM: Content Section */}
                            <div className="w-full flex-1 flex flex-col items-center bg-white px-6 py-6 text-center overflow-y-auto">

                                {/* Pills Section */}
                                <div className="flex flex-wrap justify-center gap-2 mb-6">
                                    <div className="px-3 py-1.5 bg-[#f5f0eb] rounded-full border border-[#ebe5de] select-none">
                                        <span className="text-[11px] font-medium text-[#6b635f] uppercase tracking-wide">Custom Made</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-[#f5f0eb] rounded-full border border-[#ebe5de] select-none">
                                        <span className="text-[11px] font-medium text-[#6b635f] uppercase tracking-wide">Home Baked</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-[#f5f0eb] rounded-full border border-[#ebe5de] select-none">
                                        <span className="text-[11px] font-medium text-[#6b635f] uppercase tracking-wide">100% Eggless</span>
                                    </div>
                                </div>

                                {/* Secondary Descriptive Text - Warm & Human */}
                                <p className="text-gray-600 text-xs leading-relaxed max-w-sm mb-6">
                                    Flavours can be customised based on your preference and availability. We’ll help you choose the best option that works perfectly for your celebration.
                                </p>

                                {/* Old Button Design - 3D Pressed Style */}
                                <button
                                    onClick={() => openWhatsApp(selectedProduct.name, selectedProduct.id)}
                                    className="w-full mb-3 bg-[#E46296] hover:bg-[#d65287] text-white font-serif text-lg py-3 px-6 rounded-2xl shadow-sm transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 border-b-4 border-[#be3e6e]"
                                >
                                    <FaWhatsapp className="text-white" size={22} />
                                    <span>Order on WhatsApp</span>
                                </button>

                                {/* Helper Text */}
                                <p className="text-[#a8a19c] text-[11px] max-w-[80%] leading-tight">
                                    Send us a message on WhatsApp to get a quote and start your order!
                                </p>

                            </div>
                        </div>
                    </div>
                )
            }

        </main >
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-pink-100" />}>
            <ExplorePageContent />
        </Suspense>
    );
}
