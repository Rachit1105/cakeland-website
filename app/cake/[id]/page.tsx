'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp, FaHome, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '../../../utils/supabase';

interface Product {
    id: number;
    name: string;
    image_url: string;
}

function ProductPageContent() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            `Hi! I'm interested in ordering "${product.name}".\n\n` +
            `View Product: ${productUrl}\n\n` +
            `Can you provide more details about this cake?`
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
            {/* Header */}
            <nav className="bg-[#E46296] h-20 md:h-24 px-4 md:px-10 flex items-center justify-between shadow-md">
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
                <Link
                    href="/explore"
                    className="flex items-center gap-2 text-white hover:underline transition text-sm md:text-base"
                >
                    <FaHome size={18} />
                    <span className="hidden sm:inline">Browse All Cakes</span>
                </Link>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Section */}
                        <div className="relative aspect-square bg-gray-100">
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        {/* Details Section */}
                        <div className="p-6 md:p-10 flex flex-col justify-center">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#E46296] mb-6">
                                {product.name}
                            </h1>

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
