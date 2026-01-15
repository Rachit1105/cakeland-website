'use client';
import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaHome, FaWhatsapp, FaInstagram, FaBars, FaTimes, FaBook, FaPhone, FaSearch } from 'react-icons/fa';

interface Product {
    id: number;
    name: string;
    image_url: string;
    similarity?: number;
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
    const [menuOpen, setMenuOpen] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Sync modal AND menu with URL
    useEffect(() => {
        // 1. Sync Product Modal
        const productId = searchParams.get('product');
        if (productId && allProducts.length > 0) {
            const product = allProducts.find(p => p.id === parseInt(productId));
            if (product) setSelectedProduct(product);
        } else {
            setSelectedProduct(null);
        }

        // 2. Sync Mobile Menu
        const isMenuOpen = searchParams.get('menu') === 'true';
        setMenuOpen(isMenuOpen);

    }, [searchParams, allProducts]);

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
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setAllProducts(data.products || []);
                setDisplayedProducts(data.products || []);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setIsLoading(false);
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
            }
        } catch (error) {
            console.error('Search failed:', error);
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
            `Hi! I'm interested in ordering "${cakeName}".\n\n` +
            `View Product: ${productUrl}\n\n` +
            `Can you provide more details about this cake?`
        );
        window.open(`https://wa.me/919883414650?text=${message}`, '_blank');
    };

    // Navigate to next/previous product
    const navigateProduct = (direction: 'next' | 'prev') => {
        if (!selectedProduct) return;

        const currentIndex = displayedProducts.findIndex(p => p.id === selectedProduct.id);
        let newIndex;

        if (direction === 'next') {
            newIndex = (currentIndex + 1) % displayedProducts.length;
        } else {
            newIndex = (currentIndex - 1 + displayedProducts.length) % displayedProducts.length;
        }

        const nextProduct = displayedProducts[newIndex];
        setSelectedProduct(nextProduct);

        // Update URL without adding to history stack
        const params = new URLSearchParams(searchParams.toString());
        params.set('product', nextProduct.id.toString());
        router.replace(`?${params.toString()}`, { scroll: false });

        setImageZoom(1); // Reset zoom when changing images
        setDragOffset(0); // Reset drag offset
        setIsDragging(false);
    };

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
        if (!isDragging || !touchStart) return;
        setTouchEnd(clientX);
        const diff = clientX - touchStart;
        setDragOffset(diff);
    };

    const handleSwipeEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 10;  // Reduced from 30 to 10
        const isRightSwipe = distance < -10; // Reduced from 30 to 10

        if (isLeftSwipe) {
            navigateProduct('next');
        } else if (isRightSwipe) {
            navigateProduct('prev');
        }

        setTouchStart(0);
        setTouchEnd(0);
        setDragOffset(0);
        setIsDragging(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white">

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
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search for cakes... (e.g., 'birthday', 'chocolate', 'wedding')"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-6 py-4 pr-24 rounded-full bg-white shadow-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#E46296]/30 transition-all"
                    />
                    <FaSearch className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[#E46296] text-xl pointer-events-none" />

                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <FaTimes size={20} />
                        </button>
                    )}

                    {isSearching && (
                        <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg">
                                <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {displayedProducts
                            .filter(product => !brokenImages.has(product.id))
                            .map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                                >
                                    <div className="aspect-square relative bg-gray-100">
                                        <Image
                                            src={product.image_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            loading="lazy"
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
            </div>

            {/* Simplified Modal - No Carousel */}
            {
                selectedProduct && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            closeModal();
                            resetZoom();
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
                            onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                            onTouchEnd={() => handleSwipeEnd()}
                        >
                            {/* Image Section */}
                            <div className="relative aspect-square bg-gray-100">
                                <Image
                                    src={selectedProduct.image_url}
                                    alt={selectedProduct.name}
                                    fill
                                    className="object-contain transition-transform duration-200"
                                    style={{ transform: `scale(${imageZoom})` }}
                                />

                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        closeModal();
                                        resetZoom();
                                    }}
                                    className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition z-10"
                                >
                                    <FaTimes className="text-gray-700" size={20} />
                                </button>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={() => navigateProduct('prev')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition"
                                >
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => navigateProduct('next')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition"
                                >
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Zoom Controls */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <button
                                        onClick={handleZoomIn}
                                        disabled={imageZoom >= 3}
                                        className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleZoomOut}
                                        disabled={imageZoom <= 1}
                                        className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                        </svg>
                                    </button>
                                    {imageZoom > 1 && (
                                        <button
                                            onClick={resetZoom}
                                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition text-xs font-semibold text-gray-700"
                                        >
                                            1x
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Section */}
                            <div className="p-6">
                                <button
                                    onClick={() => openWhatsApp(selectedProduct.name, selectedProduct.id)}
                                    className="w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg"
                                >
                                    <FaWhatsapp size={24} />
                                    Order on WhatsApp
                                </button>
                                <p className="mt-4 text-center text-sm text-gray-500">
                                    We'll help you customize this design!
                                </p>
                                <p className="mt-2 text-center text-xs text-gray-400">
                                    Swipe or use ← → arrows • ESC to close
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
