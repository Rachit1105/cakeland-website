'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaWhatsapp, FaInstagram, FaSearch, FaTimes, FaHome } from 'react-icons/fa';

interface Product {
    id: number;
    name: string;
    image_url: string;
    similarity?: number;
}

export default function ExplorePage() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

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
            return;
        }

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

    const openWhatsApp = (productName: string) => {
        const message = encodeURIComponent(`Hi! I'd like to order: ${productName}`);
        window.open(`https://wa.me/919883414650?text=${message}`, '_blank');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white">

            {/* Navigation */}
            <nav className={`bg-[#E46296] h-20 md:h-24 sticky top-0 z-40 shadow-md px-6 md:px-10 flex justify-between items-center transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
                }`}>
                <Link href="/" className="flex items-center">
                    <div className="w-48 h-16 md:w-56 md:h-20 relative">
                        <Image
                            src="/Cakeland.png"
                            alt="Cakeland Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </Link>
                <div className="flex items-center gap-5 text-white">
                    <Link href="/" className="font-semibold uppercase text-sm tracking-wide hover:underline transition flex items-center gap-2">
                        <FaHome size={16} />
                        Home
                    </Link>
                    <div className="h-6 w-px bg-white/50"></div>
                    <a href="https://wa.me/919883414650" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition text-white">
                        <FaWhatsapp size={24} />
                    </a>
                    <a href="https://instagram.com/cakelandkolkata" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition text-white">
                        <FaInstagram size={24} />
                    </a>
                </div>
            </nav>

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
                        Showing {displayedProducts.length} results for "<span className="font-semibold text-[#E46296]">{searchQuery}</span>"
                    </p>
                )}
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-20">
                {isLoading ? (
                    // Skeleton Loading
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg animate-pulse">
                                <div className="aspect-square bg-gray-200"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {displayedProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                                <div className="aspect-square relative">
                                    <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 text-sm truncate mb-2">
                                        {product.name}
                                    </h3>
                                    {getMatchBadge(product.similarity)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No cakes found. Try a different search!</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                selectedProduct && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedProduct(null)}
                    >
                        <div
                            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative aspect-square">
                                <Image
                                    src={selectedProduct.image_url}
                                    alt={selectedProduct.name}
                                    fill
                                    className="object-cover rounded-t-2xl"
                                />
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition"
                                >
                                    <FaTimes className="text-gray-700" size={20} />
                                </button>
                            </div>

                            <div className="p-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedProduct.name}</h2>
                                {getMatchBadge(selectedProduct.similarity)}

                                <button
                                    onClick={() => openWhatsApp(selectedProduct.name)}
                                    className="mt-6 w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
                                >
                                    <FaWhatsapp size={24} />
                                    Order on WhatsApp
                                </button>

                                <p className="mt-4 text-center text-sm text-gray-500">
                                    We'll help you customize this design!
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

        </main >
    );
}
