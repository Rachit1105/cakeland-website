'use client';
import { useEffect } from 'react';

/**
 * Hook that adds 'is-scrolling' class to document body during scroll.
 * Used to disable expensive effects like backdrop-filter while scrolling.
 * Removes the class 150ms after scrolling stops.
 */
export function useScrollPerformance() {
    useEffect(() => {
        // Only run on mobile
        if (typeof window === 'undefined') return;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;

        let scrollTimeout: NodeJS.Timeout | null = null;

        const handleScroll = () => {
            // Add scrolling class immediately
            document.body.classList.add('is-scrolling');

            // Clear existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            // Remove class after scroll stops
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        };

        // Use passive listener for better scroll performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            document.body.classList.remove('is-scrolling');
        };
    }, []);
}

export default function ScrollPerformanceProvider({ children }: { children: React.ReactNode }) {
    useScrollPerformance();
    return <>{children}</>;
}
