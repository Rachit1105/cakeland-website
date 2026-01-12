'use client';
import { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function AdminPage() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [testing, setTesting] = useState(false);

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
            setLogs(prev => [`📤 Uploading: ${file.name}...`, ...prev]);

            // A. Upload Image to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('menu-photos')
                .upload(fileName, file);

            if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

            setLogs(prev => [`📸 Uploaded: ${file.name}, generating AI embedding...`, ...prev]);

            // B. Get the Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('menu-photos')
                .getPublicUrl(fileName);

            // C. Send URL to our API for analysis
            const aiResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: publicUrl })
            });

            if (!aiResponse.ok) {
                const errorData = await aiResponse.json();
                throw new Error(`AI Analysis Failed: ${JSON.stringify(errorData)}`);
            }

            const { embedding } = await aiResponse.json();

            setLogs(prev => [`💾 Saving to database: ${file.name}...`, ...prev]);

            // D. Save Image URL + AI Numbers to Database
            const { error: dbError } = await supabase.from('products').insert({
                name: file.name.split('.')[0], // Use filename as cake name
                image_url: publicUrl,
                embedding: embedding
                // category_id left null as requested
            });

            if (dbError) throw new Error(`DB Error: ${dbError.message}`);

            // Log Success
            setLogs(prev => [`✅ Success: ${file.name}`, ...prev]);

        } catch (error: any) {
            console.error('Process error:', error);
            setLogs(prev => [`❌ Failed: ${file.name} - ${error.message}`, ...prev]);
        }
    };

    // 2. MANAGER FUNCTION: Handles the queue
    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        setLogs(['🚀 Starting bulk upload...']);
        setProgress(0);

        const files = Array.from(e.target.files);
        const total = files.length;
        let completed = 0;
        const CONCURRENCY_LIMIT = 3; // Process 3 images at a time

        setLogs(prev => [`📊 Total files: ${total}`, ...prev]);

        // Loop through files in "chunks"
        for (let i = 0; i < total; i += CONCURRENCY_LIMIT) {
            const chunk = files.slice(i, i + CONCURRENCY_LIMIT);

            // Wait for the current chunk of 3 images to finish completely
            await Promise.all(chunk.map(async (file) => {
                await processFile(file);
                completed++;
                setProgress(Math.round((completed / total) * 100));
            }));
        }

        setUploading(false);
        setLogs(prev => ['🎉 BATCH COMPLETE!', ...prev]);
    };

    return (
        <div className="min-h-screen p-10 bg-gray-50 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-8">Admin: Bulk Smart Upload</h1>

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
    );
}