'use client';
import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { FaWhatsapp, FaInstagram, FaSearch, FaBook, FaBars, FaTimes, FaPhone, FaInfoCircle } from 'react-icons/fa';

interface Product {
  id: number;
  name: string;
  image_url: string;
  thumbnail_url?: string | null;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselProducts, setCarouselProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    const isMenuOpen = searchParams.get('menu') === 'true';
    setMenuOpen(isMenuOpen);
  }, [searchParams]);

  const toggleMenu = () => {
    if (menuOpen) {
      router.back();
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('menu', 'true');
      router.push(`?${params.toString()}`);
    }
  };

  const closeMenu = () => {
    if (menuOpen) router.back();
  };

  const fetchRandomProducts = useCallback(async () => {
    try {
      // Fetch more products for better randomization
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        // Fisher-Yates shuffle for true randomness
        const products = [...data.products];
        for (let i = products.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [products[i], products[j]] = [products[j], products[i]];
        }
        setCarouselProducts(products.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomProducts();
  }, [fetchRandomProducts]);

  useEffect(() => {
    if (carouselProducts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselProducts.length, timerKey]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
      setTimerKey((prev) => prev + 1);
    }
    if (distance < -50) {
      setCurrentSlide((prev) => (prev - 1 + carouselProducts.length) % carouselProducts.length);
      setTimerKey((prev) => prev + 1);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  const getCardPosition = (index: number) => {
    const len = carouselProducts.length;
    if (len === 0) return 'carousel-card-hidden';

    let diff = index - currentSlide;

    // Normalize for circular array
    if (diff > len / 2) diff -= len;
    if (diff < -len / 2) diff += len;

    if (diff === 0) return 'carousel-card-center';
    if (diff === -1) return 'carousel-card-left';
    if (diff === 1) return 'carousel-card-right';
    if (diff === -2) return 'carousel-card-far-left';
    if (diff === 2) return 'carousel-card-far-right';
    return 'carousel-card-hidden';
  };

  const features = [
    { icon: '✨', title: 'Custom Designs', subtitle: 'Any theme you imagine' },
    { icon: '🎂', title: 'Fresh Daily', subtitle: 'Baked every morning' },
    { icon: '💝', title: 'Made with Love', subtitle: '500+ happy customers' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-white relative overflow-hidden">

      {/* Bokeh Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large soft circles */}
        <div className="absolute top-10 left-5 w-40 h-40 bg-pink-300/50 rounded-full blur-3xl animate-float" />
        <div className="absolute top-32 right-10 w-56 h-56 bg-pink-200/40 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-40 left-1/4 w-52 h-52 bg-pink-300/45 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 right-5 w-36 h-36 bg-pink-200/50 rounded-full blur-2xl animate-float" />
        <div className="absolute top-1/2 left-10 w-28 h-28 bg-white/60 rounded-full blur-2xl animate-float-delayed" />
        <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-pink-100/70 rounded-full blur-2xl animate-float-slow" />
        {/* Sparkle particles */}
        <div className="absolute top-20 left-1/3 w-3 h-3 bg-white rounded-full animate-pulse opacity-80" />
        <div className="absolute top-40 right-1/4 w-2 h-2 bg-pink-200 rounded-full animate-pulse opacity-90" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-1/2 w-2 h-2 bg-white rounded-full animate-pulse opacity-70" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-20 w-3 h-3 bg-pink-100 rounded-full animate-pulse opacity-80" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-60 right-20 w-2 h-2 bg-white rounded-full animate-pulse opacity-90" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-60 right-10 w-3 h-3 bg-pink-200 rounded-full animate-pulse opacity-75" style={{ animationDelay: '0.8s' }} />
        {/* Extra glow layers */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-pink-200/30 to-transparent" />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#E46296] h-20 md:h-24 z-40 shadow-lg flex items-center justify-between px-2 md:px-10">
        <div className="w-44 h-16 md:w-56 md:h-20 relative -ml-2 md:ml-0">
          <Image
            src="/Cakeland.png"
            alt="Cakeland Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <nav className="hidden md:flex items-center gap-5 text-white">
          <Link href="/explore" className="font-semibold uppercase text-sm tracking-wide hover:underline transition flex items-center gap-2">
            <FaSearch size={16} />
            Explore
          </Link>
          <div className="h-6 w-px bg-white/50" />
          <Link href="/menu" className="font-semibold uppercase text-sm tracking-wide hover:underline transition flex items-center gap-2">
            <FaBook size={18} />
            Menu
          </Link>
          <div className="h-6 w-px bg-white/50" />
          <a href="https://wa.me/919883414650" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition duration-200">
            <FaWhatsapp size={24} />
          </a>
          <a href="https://instagram.com/cakelandkolkata" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition duration-200">
            <FaInstagram size={24} />
          </a>
        </nav>

        <div className="flex md:hidden items-center gap-3 text-white">
          <Link href="/explore" className="font-semibold text-base tracking-wide hover:underline transition flex items-center gap-2">
            <FaSearch size={18} />
            Explore
          </Link>
          <div className="h-6 w-px bg-white/50" />
          <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded transition">
            {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

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
          <div className="h-px bg-white/30" />
          <a href="https://wa.me/919883414650" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
            <FaWhatsapp size={20} />
            <span className="font-semibold">WhatsApp</span>
          </a>
          <a href="https://instagram.com/cakelandkolkata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
            <FaInstagram size={20} />
            <span className="font-semibold">Instagram</span>
          </a>
          <div className="h-px bg-white/30" />
          <a href="tel:+919883414650" className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
            <FaPhone size={20} />
            <span className="font-semibold">Call Us</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 md:pt-28 px-4 pb-12">

        {/* 3D Carousel Section */}
        <div
          className="relative h-[380px] md:h-[480px] flex items-center justify-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
              {carouselProducts.map((product, index) => {
                const position = getCardPosition(index);
                const isVisible = position !== 'carousel-card-hidden';

                return (
                  <Link
                    key={product.id}
                    href={`/cake/${product.id}`}
                    className={`carousel-card absolute w-56 h-64 md:w-72 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 cursor-pointer hover:scale-105 transition-transform ${position}`}
                    style={{ display: isVisible ? 'block' : 'none' }}
                  >
                    <Image
                      src={product.thumbnail_url || product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 224px, 288px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Carousel Dots - Below Carousel */}
        <div className="flex justify-center gap-2 mb-8">
          {carouselProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                setTimerKey((prev) => prev + 1);
              }}
              className={`transition-all duration-300 rounded-full ${index === currentSlide
                ? 'w-6 h-2 bg-[#E46296]'
                : 'w-2 h-2 bg-pink-300 hover:bg-pink-400'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>



        {/* Headline */}
        <div className="text-center mb-8 px-4">
          <h2 className="text-2xl md:text-3xl text-gray-700 leading-relaxed" style={{ fontFamily: 'Georgia, Times, serif' }}>
            Find your perfect cake in seconds.
            <br />
            <span className="font-semibold text-gray-800">Just describe it.</span>
          </h2>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-3 mb-12 px-4">
          {/* Explore Cakes - Primary CTA */}
          <Link
            href="/explore"
            className="w-full max-w-sm py-4 px-8 btn-shimmer text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 animate-pulse-glow"
          >
            <span className="text-2xl">🍰</span>
            Explore Cakes
          </Link>

          {/* Powered by AI text */}
          <p className="text-gray-500 text-sm flex items-center gap-2 mb-2">
            <FaSearch size={14} className="text-gray-400" />
            Powered by AI cake search
          </p>

          {/* View Menu - Secondary CTA */}
          <Link
            href="/menu"
            className="w-full max-w-sm py-4 px-8 bg-white/90 backdrop-blur text-[#E46296] font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 border border-pink-100"
          >
            <FaBook size={20} className="text-[#E46296]" />
            View Menu
          </Link>

          {/* About Us - Text link */}
          <Link
            href="/about"
            className="py-3 text-gray-700 font-semibold text-lg hover:text-[#E46296] transition-colors duration-300 flex items-center gap-2"
          >
            <FaInfoCircle size={18} className="text-pink-400" />
            About Us
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-10 px-2 max-w-md mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-3 md:p-5 text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-xl md:text-3xl mb-1 md:mb-2">{feature.icon}</div>
              <h3 className="text-xs md:text-sm font-bold text-[#E46296] mb-0.5 md:mb-1 leading-tight">{feature.title}</h3>
              <p className="text-xs md:text-sm text-gray-500">{feature.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm md:text-base">
            <span className="text-yellow-500">⭐</span> Rated 4.8 by customers in Kolkata
          </p>
        </div>

        {/* Logo & Tagline - Bottom */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6 w-64 h-24 md:w-80 md:h-28">
            {/* Warm rose spotlight gradient behind logo */}
            <div
              className="absolute inset-0 scale-110 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(180, 50, 90, 0.16) 0%, rgba(180, 50, 90, 0.06) 35%, transparent 55%)'
              }}
            />
            <Image
              src="/Cakeland.png"
              alt="Cakeland Logo"
              fill
              className="object-contain relative z-10"
              style={{
                filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.08))'
              }}
            />
          </div>
          <p
            className="text-lg md:text-xl text-[#c92a6e] font-medium italic"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.06)' }}
          >
            flavours that feel like home
          </p>
        </div>

      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pink-100" />}>
      <HomeContent />
    </Suspense>
  );
}