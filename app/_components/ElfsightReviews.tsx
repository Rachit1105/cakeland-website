'use client';
import { useEffect, useState, useRef } from 'react';

const ELFSIGHT_STORAGE_KEY = 'elfsight_reviews_last_loaded';
const ELFSIGHT_APP_ID = 'elfsight-app-de5cee99-127f-4abc-bf61-371977a92d14';
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const GOOGLE_REVIEWS_URL = 'https://share.google/dUK7pNX0M2YIxjwqa';

// Fallback UI when widget is not loaded
function ReviewsFallback() {
    return (
        <div className="w-full py-8 flex flex-col items-center justify-center min-h-[180px]">
            <div className="text-yellow-400 text-2xl mb-3">★★★★★</div>
            <p className="text-gray-700 font-medium text-lg mb-2">
                Rated 4.8 by customers in Kolkata
            </p>
            <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E46296] hover:text-[#d63384] font-medium underline underline-offset-2 transition-colors"
            >
                See more reviews on Google →
            </a>
        </div>
    );
}

export default function ElfsightReviews() {
    const [loadState, setLoadState] = useState<'checking' | 'load' | 'fallback'>('checking');
    const [isReady, setIsReady] = useState(false);
    const scriptInjected = useRef(false);

    useEffect(() => {
        let shouldLoad = true;

        try {
            const storedTimestamp = localStorage.getItem(ELFSIGHT_STORAGE_KEY);

            if (storedTimestamp) {
                const lastLoad = parseInt(storedTimestamp, 10);
                const now = Date.now();
                const elapsed = now - lastLoad;

                if (elapsed < CACHE_DURATION_MS) {
                    // Within 12 hours - check if script exists in current session
                    const existingScript = document.querySelector('script[src*="elfsightcdn.com/platform.js"]');
                    if (existingScript) {
                        // Same session navigation, keep widget
                        shouldLoad = true;
                    } else {
                        // Page refresh or new visit within 12 hours - show fallback
                        shouldLoad = false;
                    }
                }
                // If elapsed >= 12 hours, allow fresh load (shouldLoad remains true)
            }
            // If no stored timestamp, first time ever (shouldLoad remains true)
        } catch {
            // localStorage unavailable, allow load
            shouldLoad = true;
        }

        setLoadState(shouldLoad ? 'load' : 'fallback');
    }, []);

    useEffect(() => {
        if (loadState !== 'load') return;

        const existingScript = document.querySelector('script[src*="elfsightcdn.com/platform.js"]');

        if (!existingScript && !scriptInjected.current) {
            scriptInjected.current = true;
            const script = document.createElement('script');
            script.src = 'https://elfsightcdn.com/platform.js';
            script.async = true;
            script.onload = () => {
                try {
                    localStorage.setItem(ELFSIGHT_STORAGE_KEY, Date.now().toString());
                } catch {
                    // Ignore
                }
                setIsReady(true);
            };
            document.body.appendChild(script);
        } else {
            // Script already exists
            try {
                localStorage.setItem(ELFSIGHT_STORAGE_KEY, Date.now().toString());
            } catch {
                // Ignore
            }
            setIsReady(true);
        }
    }, [loadState]);

    // Checking state - show loading spinner
    if (loadState === 'checking') {
        return (
            <div className="w-full min-h-[180px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Fallback state - show static fallback UI
    if (loadState === 'fallback') {
        return <ReviewsFallback />;
    }

    // Load state - render actual widget with size constraints
    return (
        <div className="w-full flex justify-center">
            <div
                className="w-full max-w-lg origin-top"
                style={{ transform: 'scale(0.9)' }}
            >
                <div
                    className={ELFSIGHT_APP_ID}
                    data-elfsight-app-lazy
                />
                {!isReady && (
                    <div className="w-full h-40 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}
