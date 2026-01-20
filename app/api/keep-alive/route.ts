import { NextResponse } from 'next/server';

const CLIP_API_URL = 'https://rachit1105-clip-embedding-api.hf.space';

/**
 * Keep-Alive Endpoint
 * 
 * Purpose: Prevents the Hugging Face CLIP API Space from going to sleep
 * by sending a lightweight ping request every 24 hours.
 * 
 * This endpoint should be called by a cron job service (e.g., cron-job.org, EasyCron, GitHub Actions)
 */
export async function GET() {
    try {
        console.log('[Keep-Alive] Pinging CLIP API to prevent sleep...');

        const startTime = Date.now();

        // Send a simple test query to wake up the Space
        const response = await fetch(`${CLIP_API_URL}/embed-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'keep-alive ping' }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        const duration = Date.now() - startTime;

        if (response.ok) {
            console.log(`[Keep-Alive] ✅ Success! CLIP API responded in ${duration}ms`);
            return NextResponse.json({
                success: true,
                message: 'CLIP API is awake and responsive',
                responseTime: `${duration}ms`,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error(`[Keep-Alive] ❌ CLIP API returned status ${response.status}`);
            return NextResponse.json({
                success: false,
                error: `CLIP API returned status ${response.status}`,
                responseTime: `${duration}ms`,
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }

    } catch (error: any) {
        console.error('[Keep-Alive] ❌ Failed to ping CLIP API:', error.message);

        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to ping CLIP API',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
