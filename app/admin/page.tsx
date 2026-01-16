'use client';
import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import AdminHeader from './_components/AdminHeader';

export default function AdminPage() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [testing, setTesting] = useState(false);
    const [uploadSummary, setUploadSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

    // Test Supabase connection
    const testConnection = async () => {
        setTesting(true);
        setLogs(['🔍 Testing Supabase connection...']);

        try {
            // Test 1: Check if we can connect to database
            const { data, error } = await supabase.from('products').select('count');
            if (error) {
                setLogs(prev => [...prev, `❌ Database Error: ${error.message}`]);
                setLogs(prev => [...prev, `💡 Create the products table in Supabase SQL Editor`]);
            } else {
                setLogs(prev => [...prev, '✅ Database connection successful']);
            }

            // Test 2: Try to access the storage bucket directly
            setLogs(prev => [...prev, '📦 Testing storage bucket access...']);
            const { data: files, error: bucketError } = await supabase.storage
                .from('menu-photos')
                .list('', { limit: 1 });

            if (bucketError) {
                setLogs(prev => [...prev, `❌ Bucket access error: ${bucketError.message}`]);
                setLogs(prev => [...prev, `💡 Make sure "menu-photos" bucket exists and is PUBLIC`]);
            } else {
                setLogs(prev => [...prev, '✅ Storage bucket "menu-photos" is accessible']);
            }

            // Test 3: Check AI endpoint
            setLogs(prev => [...prev, '🤖 Testing AI endpoint (this may take 30-60 seconds on first run)...']);
            const testResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: 'https://via.placeholder.com/150' })
            });

            if (testResponse.ok) {
                const data = await testResponse.json();
                setLogs(prev => [...prev, '✅ AI endpoint working (CLIP model loaded)']);
            } else {
                const errorData = await testResponse.json();
                setLogs(prev => [...prev, `❌ AI Error: ${JSON.stringify(errorData)}`]);
            }

        } catch (error: any) {
            setLogs(prev => [...prev, `❌ Connection test failed: ${error.message}`]);
        } finally {
            setTesting(false);
            setLogs(prev => [...prev, '✅ All tests complete!']);
        }
    };

    // 1. WORKER FUNCTION: Handles the full lifecycle for ONE file
    const processFile = async (file: File) => {
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}-${file.name}`;

        try {
            setLogs(prev => [`📤 Uploading to Cloudinary: ${file.name}...`, ...prev]);

            // A. Convert original file to base64
            const originalBuffer = await file.arrayBuffer();
            const originalBase64 = Buffer.from(originalBuffer).toString('base64');
            const originalDataUrl = `data:${file.type};base64,${originalBase64}`;

            // B. Create thumbnail using Canvas API
            setLogs(prev => [`🖼️ Creating thumbnail: ${file.name}...`, ...prev]);

            // Import compression utility dynamically (client-side only)
            const { createThumbnail } = await import('@/utils/imageCompression');
            const thumbnailDataUrl = await createThumbnail(file);

            setLogs(prev => [`☁️ Uploading both versions to Cloudinary: ${file.name}...`, ...prev]);

            // C. Upload both to Cloudinary via our API
            const cloudinaryResponse = await fetch('/api/admin/upload-cloudinary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalFile: originalDataUrl,
                    thumbnailFile: thumbnailDataUrl,
                    filename: fileName
                })
            });

            if (!cloudinaryResponse.ok) {
                const errorData = await cloudinaryResponse.json();
                throw new Error(`Cloudinary Upload Failed: ${errorData.error || 'Unknown error'}`);
            }

            const { originalUrl, thumbnailUrl } = await cloudinaryResponse.json();

            setLogs(prev => [`📸 Uploaded both versions: ${file.name}, generating AI embedding...`, ...prev]);

            // D. Send original Cloudinary URL to our API for analysis
            const aiResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: originalUrl })
            });

            if (!aiResponse.ok) {
                const errorData = await aiResponse.json();
                throw new Error(`AI Analysis Failed: ${JSON.stringify(errorData)}`);
            }

            const { embedding } = await aiResponse.json();

            setLogs(prev => [`💾 Saving to database: ${file.name}...`, ...prev]);

            // E. Save both Cloudinary URLs + AI embedding to Supabase Database
            const { error: dbError } = await supabase.from('products').insert({
                name: file.name.split('.')[0], // Use filename as cake name
                image_url: originalUrl, // Original full-quality image
                thumbnail_url: thumbnailUrl, // Pre-compressed thumbnail
                embedding: embedding
                // category_id left null as requested
            });

            if (dbError) throw new Error(`DB Error: ${dbError.message}`);

            // Log Success
            setLogs(prev => [`✅ Success: ${file.name}`, ...prev]);

        } catch (error: any) {
            console.error('Process error:', error);
            setLogs(prev => [`❌ Failed: ${file.name} - ${error.message}`, ...prev]);
            throw error; // Re-throw to be caught by the caller
        }
    };

    // 2. MANAGER FUNCTION: Handles the queue
    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        setLogs(['🚀 Starting bulk upload...']);
        setProgress(0);
        setUploadSummary(null);

        const files = Array.from(e.target.files);
        const total = files.length;
        let completed = 0;
        let successCount = 0;
        let failedCount = 0;
        const CONCURRENCY_LIMIT = 3; // Process 3 images at a time

        setLogs(prev => [`📊 Total files: ${total}`, ...prev]);

        // Loop through files in "chunks"
        for (let i = 0; i < total; i += CONCURRENCY_LIMIT) {
            const chunk = files.slice(i, i + CONCURRENCY_LIMIT);

            // Wait for the current chunk of 3 images to finish completely
            const results = await Promise.allSettled(chunk.map(async (file) => {
                try {
                    await processFile(file);
                    return 'success';
                } catch (error) {
                    return 'failed';
                }
            }));

            // Count successes and failures
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value === 'success') {
                    successCount++;
                } else {
                    failedCount++;
                }
                completed++;
                setProgress(Math.round((completed / total) * 100));
            });
        }

        setUploading(false);
        setUploadSummary({ total, success: successCount, failed: failedCount });
        setLogs(prev => ['🎉 BATCH COMPLETE!', ...prev]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader />

            <div className="p-10 flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-8">Bulk Smart Upload</h1>

                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl text-center">
                    {/* Test Connection Button */}
                    <button
                        onClick={testConnection}
                        disabled={testing || uploading}
                        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {testing ? 'Testing...' : '🔧 Test Connection'}
                    </button>

                    <label className="block mb-4 font-semibold text-gray-700">
                        Upload Cake Photos (Bulk)
                    </label>

                    {/* File Input */}
                    <input
                        type="file"
                        multiple // Allow selecting 200+ files
                        accept="image/*"
                        onChange={handleBulkUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-pink-50 file:text-pink-700
                hover:file:bg-pink-100 mb-6"
                    />

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                            <div
                                className="bg-pink-600 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}

                    {uploading && <p className="text-sm text-gray-500 mb-4">{progress}% Complete</p>}

                    {/* Upload Summary */}
                    {uploadSummary && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold text-blue-900 mb-2">Upload Complete!</h3>
                            <div className="text-sm text-blue-800 space-y-1">
                                <p>Total: {uploadSummary.total} files</p>
                                <p className="text-green-700">✅ Successful: {uploadSummary.success}</p>
                                <p className="text-red-700">❌ Failed: {uploadSummary.failed}</p>
                            </div>
                        </div>
                    )}

                    {/* Logs Area */}
                    <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-xs text-left border border-gray-200">
                        {logs.length === 0 ? (
                            <p className="text-gray-400 text-center italic">Logs will appear here...</p>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={`mb-1 ${log.includes('Failed') || log.includes('Error') ? 'text-red-600' : log.includes('Success') ? 'text-green-700' : 'text-gray-700'}`}>
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}