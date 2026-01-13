'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaWhatsapp, FaInstagram, FaSearch, FaHome, FaBook, FaBars, FaTimes, FaPhone } from 'react-icons/fa';

export default function Home() {
  const [introComplete] = useState(true); // Skip intro, go straight to carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = [
    {
      type: "welcome",
      title: "Cakeland",
      tagline: "Crafting Sweet Memories Since 2020",
      features: [
        { icon: "✨", text: "Custom Designs" },
        { icon: "🎂", text: "Fresh Daily" },
        { icon: "💝", text: "Made with Love" }
      ],
      cta: "About Us",
      link: "/about",
      icon: "🔍"
    },
    {
      type: "standard",
      title: "Explore Our Creations",
      description: "Discover our AI-powered cake gallery with smart search",
      cta: "Start Exploring",
      link: "/explore",
      icon: "🔍"
    },
    {
      type: "standard",
      title: "Dive Into Our Menu",
      description: "Browse our complete collection of signature cakes",
      cta: "View Menu",
      link: "/menu",
      icon: "🎂"
    }
  ];

  // Auto-rotate carousel (resets when user swipes manually)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length, currentSlide]); // Resets timer whenever currentSlide changes

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
    if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse drag handlers (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart === 0) return;
    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftDrag = distance > 50;
    const isRightDrag = distance < -50;

    if (isLeftDrag) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
    if (isRightDrag) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000">

      {/* --- SIDE DECORATIONS (only during intro) --- */}
      <div
        className={`absolute top-0 bottom-0 left-4 md:left-10 flex items-center h-full z-0 transition-opacity duration-1000 ${introComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
      >
        <div className="flex h-full relative">
          <div className="w-6 md:w-12 bg-white h-full shadow-lg"></div>
          <div className="w-2 md:w-4 bg-pink-200 h-full"></div>
          <div className="w-1 md:w-2 bg-white h-full opacity-80"></div>
          <div className="absolute top-1/2 -left-2 md:-left-4 transform -translate-y-1/2 w-12 h-12 md:w-20 md:h-20 bg-white rotate-45 flex items-center justify-center shadow-md">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-pink-200 rotate-90 opacity-40"></div>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-0 bottom-0 right-4 md:right-10 flex items-center h-full z-0 flex-row-reverse transition-opacity duration-1000 ${introComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
      >
        <div className="flex h-full flex-row-reverse relative">
          <div className="w-6 md:w-12 bg-white h-full shadow-lg"></div>
          <div className="w-2 md:w-4 bg-pink-200 h-full"></div>
          <div className="w-1 md:w-2 bg-white h-full opacity-80"></div>
          <div className="absolute top-1/2 -right-2 md:-right-4 transform -translate-y-1/2 w-12 h-12 md:w-20 md:h-20 bg-white rotate-45 flex items-center justify-center shadow-md">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-pink-200 rotate-90 opacity-40"></div>
          </div>
        </div>
      </div>



      {/* --- PINK HEADER WITH RECTANGULAR LOGO --- */}
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5 text-white">
          <Link href="/explore" className="font-semibold uppercase text-sm tracking-wide hover:underline transition flex items-center gap-2">
            <FaSearch size={16} />
            Explore
          </Link>
          <div className="h-6 w-px bg-white/50"></div>
          <Link href="/menu" className="font-semibold uppercase text-sm tracking-wide hover:underline transition flex items-center gap-2">
            <FaBook size={18} />
            Menu
          </Link>
          <div className="h-6 w-px bg-white/50"></div>
          <a href="https://wa.me/919883414650" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition duration-200">
            <FaWhatsapp size={24} />
          </a>
          <a href="https://instagram.com/cakelandkolkata" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition duration-200">
            <FaInstagram size={24} />
          </a>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-3 text-white">
          <Link href="/explore" className="font-semibold text-base tracking-wide hover:underline transition flex items-center gap-2">
            <FaSearch size={18} />
            Explore
          </Link>
          <div className="h-6 w-px bg-white/50"></div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-white/10 rounded transition">
            {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`fixed top-20 right-0 w-64 bg-[#E46296] text-white shadow-xl z-30 transition-transform duration-300 md:hidden rounded-bl-2xl ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="flex flex-col p-6 gap-6">
          <Link href="/menu" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 hover:bg-white/10 p-3 rounded transition">
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


      {introComplete && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-5xl px-4 py-8 pt-28 md:pt-32">

          {/* Pink Circle Accent */}
          <div className="absolute top-32 right-10 w-40 h-40 bg-pink-200/40 rounded-full -z-10"></div>
          <div className="absolute bottom-40 left-10 w-60 h-60 bg-pink-200/30 rounded-full -z-10"></div>

          <div className="text-center mt-20 md:mt-16 relative w-full">

            {/* Carousel Container */}
            <div
              className="relative overflow-visible min-h-[550px] md:min-h-[600px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {slides.map((slide, index) => {
                // Calculate position relative to current slide for infinite loop
                let position = index - currentSlide;

                // Handle infinite loop: if slide is far behind, place it ahead
                if (position < -1) {
                  position = slides.length + position;
                }
                // If slide is far ahead, place it behind  
                if (position > 1) {
                  position = position - slides.length;
                }

                return (
                  <div
                    key={index}
                    className={`absolute w-full transition-all duration-700 ease-in-out ${position === 0
                      ? 'opacity-100 translate-x-0'
                      : position < 0
                        ? 'opacity-0 -translate-x-full'
                        : 'opacity-0 translate-x-full'
                      }`}
                  >
                    {slide.type === 'welcome' ? (
                      // Welcome Slide with Large Logo
                      <>
                        <div className="w-72 h-72 md:w-96 md:h-96 relative mx-auto mb-10 rounded-3xl overflow-hidden border-4 border-pink-200 shadow-2xl">
                          <Image
                            src="/10.png"
                            alt="Cakeland Logo"
                            fill
                            className="object-cover"
                          />
                        </div>

                        <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
                          {slide.tagline}
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 mb-10">
                          {slide.features?.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 px-5 py-2 bg-pink-50 text-[#E46296] rounded-full text-sm font-semibold border-2 border-pink-100">
                              <span className="text-base">{feature.icon}</span>
                              <span>{feature.text}</span>
                            </div>
                          ))}
                        </div>

                        <Link
                          href={slide.link}
                          className="inline-flex items-center gap-3 px-10 py-5 bg-[#E46296] text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                          <FaHome size={22} />
                          {slide.cta}
                        </Link>
                      </>
                    ) : (
                      // Standard Slides
                      <>
                        <div className="text-7xl md:text-8xl mb-8 animate-bounce">{slide.icon}</div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-[#E46296] mb-6 px-4">
                          {slide.title}
                        </h1>

                        <div className="w-24 h-1 bg-[#E46296] mx-auto mb-6"></div>

                        <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-10 font-light max-w-2xl mx-auto px-4">
                          {slide.description}
                        </p>

                        <Link
                          href={slide.link}
                          className="inline-flex items-center gap-3 px-10 py-5 bg-[#E46296] text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                          {slide.link === '/menu' ? <FaBook size={22} /> : <FaSearch size={22} />}
                          {slide.cta}
                        </Link>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Carousel Dots Navigation */}
            <div className="flex justify-center gap-3 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 rounded-full ${index === currentSlide
                    ? 'w-8 h-3 bg-[#E46296]'
                    : 'w-3 h-3 bg-pink-200 hover:bg-pink-300'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}