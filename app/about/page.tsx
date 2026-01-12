'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FaHome } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function AboutPage() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white flex flex-col">

            {/* NAVIGATION BAR */}
            <nav className={`bg-[#E46296] h-20 md:h-24 px-6 md:px-10 text-white flex justify-between items-center sticky top-0 z-50 shadow-md transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
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
                <Link href="/" className="font-semibold uppercase text-sm tracking-wide hover:underline flex items-center gap-2">
                    <FaHome size={16} />
                    Home
                </Link>
            </nav>

            {/* CONTENT AREA */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-5xl font-serif font-bold text-[#E46296] mb-4">
                        About Us
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Coming soon...
                    </p>
                </div>
            </main>

        </div>
    );
}
