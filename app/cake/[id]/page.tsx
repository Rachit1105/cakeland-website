'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp, FaInstagram, FaHome, FaBars, FaTimes, FaBook, FaPhone, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '../../../utils/supabase';
import { getLargeImageUrl } from '@/utils/imageHelpers';

interface Product {
    id: number;
    name: string;
    image_url: string;
}

function ProductPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // Sync Mobile Menu with URL
    useEffect(() => {
        const isMenuOpen = searchParams.get('menu') === 'true';
        setMenuOpen(isMenuOpen);
    }, [searchParams]);

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

    // Handle closing menu
    const closeMenu = () => {
        if (menuOpen) router.back();
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productId = parseInt(params.id as string);

                if (isNaN(productId)) {
                    setError('Invalid product ID');
                    setLoading(false);
                    return;
                }

                const { data, error: dbError } = await supabase
                    .from('products')
                    .select('id, name, image_url')
                    .eq('id', productId)
                    .single();

                if (dbError || !data) {
                    setError('Product not found');
                    setLoading(false);
                    return;
                }

                setProduct(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product');
                setLoading(false);
            }
        };

        fetchProduct();
    }, [params.id]);

    const openWhatsApp = () => {
        if (!product) return;

        // Use window.location safely (only available client-side)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cakeland-website.vercel.app';
        const productUrl = `${baseUrl}/cake/${product.id}`;
        const message = encodeURIComponent(
            `Hi Cakeland 👋🍰\n\n` +
            `I came across this cake design on your website and I'm interested in ordering it.\n` +
            `Reference Link: ${productUrl}\n\n` +
            `Could you please share the available sizes, pricing, and customization options?\n\n` +
            `Looking forward to your reply 😊`
        );
        window.open(`https://wa.me/919883414650?text=${message}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#E46296] mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading cake details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white flex flex-col">
                {/* Header */}
                <nav className="bg-[#E46296] h-20 md:h-24 px-4 md:px-10 flex items-center shadow-md">
                    <Link href="/" className="flex items-center">
                        <div className="w-44 h-16 md:w-56 md:h-20 relative">
                            <Image
                                src="/Cakeland.png"
                                alt="Cakeland Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </Link>
                </nav>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">🍰</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cake Not Found</h1>
                        <p className="text-gray-600 mb-8">
                            {error || "We couldn't find the cake you're looking for."}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
                            >
                                <FaArrowLeft />
                                Go Back
                            </button>
                            <Link
                                href="/explore"
                                className="flex items-center gap-2 px-6 py-3 bg-[#E46296] text-white rounded-full hover:bg-[#d4507e] transition"
                            >
                                Browse All Cakes
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white flex flex-col">
            {/* NAVIGATION BAR */}
            <nav className="bg-[#E46296] h-20 md:h-24 px-2 md:px-10 text-white flex justify-between items-center sticky top-0 z-50 shadow-md">
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
                <div className="hidden md:flex items-center gap-3 md:gap-6">
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
                <div className="flex md:hidden items-center gap-3">
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
                    <Link href="/explore" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
                        <FaSearch size={20} />
                        <span className="font-semibold">Explore</span>
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

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Section */}
                        <div className="relative aspect-square bg-gray-100">
                            <Image
                                src={getLargeImageUrl(product.image_url)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Details Section */}
                        <div className="p-6 md:p-10 flex flex-col justify-center">

                            <div className="mb-8">
                                <p className="text-gray-600 text-base leading-relaxed">
                                    Beautifully crafted cake, perfect for any celebration.
                                    Contact us for customization options, sizes, and pricing.
                                </p>
                            </div>

                            {/* WhatsApp Button */}
                            <button
                                onClick={openWhatsApp}
                                className="w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg mb-4"
                            >
                                <FaWhatsapp size={24} />
                                Order on WhatsApp
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                We'll help you customize this design!
                            </p>

                            {/* Back to Explore */}
                            <Link
                                href="/explore"
                                className="mt-6 text-center text-[#E46296] hover:underline text-sm"
                            >
                                ← Back to all cakes
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Note */}
            <footer className="text-center py-6 text-gray-500 text-sm">
                Share this page with friends! 🎂
            </footer>
        </div>
    );
}

export default function ProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-pink-100" />}>
            <ProductPageContent />
        </Suspense>
    );
}
