'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaHome, FaWhatsapp, FaInstagram, FaBars, FaTimes, FaSearch, FaPhone } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function MenuPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
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
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white flex flex-col">

            {/* NAVIGATION BAR */}
            <nav className={`bg-[#E46296] h-20 md:h-24 px-2 md:px-10 text-white flex justify-between items-center sticky top-0 z-50 shadow-md transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
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

            {/* MENU IMAGES STACK */}
            <main className="w-full max-w-2xl mx-auto bg-white shadow-2xl mt-0 mb-0 flex-1">
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

        </div>
    );
}
