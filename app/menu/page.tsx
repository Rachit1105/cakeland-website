'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FaHome } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function MenuPage() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down & past threshold
                setIsVisible(false);
            } else {
                // Scrolling up
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const menuPages = [
        '/Cakeland_Menu_page-0001.jpg',
        '/Cakeland_Menu_page-0002.jpg',
        '/Cakeland_Menu_page-0003.jpg',
        '/Cakeland_Menu_page-0004.jpg',
        '/Cakeland_Menu_page-0005.jpg'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white">

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

            {/* MENU IMAGES STACK */}
            <main className="w-full max-w-2xl mx-auto bg-white shadow-2xl my-8">
                {menuPages.map((pageSrc, index) => (
                    <div key={index} className="relative w-full">
                        <img
                            src={pageSrc}
                            alt={`Cakeland Menu Page ${index + 1}`}
                            className="w-full h-auto block border-b border-gray-100"
                        />
                    </div>
                ))}
            </main>

            {/* FOOTER */}
            <footer className="bg-[#4A3B32] text-white text-center py-8">
                <p className="font-serif text-xl mb-2">To Order</p>
                <p className="text-lg font-bold">Madhu Agarwal: +91 98834 14650</p>
                <p className="text-sm text-gray-400 mt-2">@cakelandkolkata</p>
            </footer>

        </div>
    );
}
