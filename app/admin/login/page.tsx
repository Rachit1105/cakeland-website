'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function AdminLoginPage() {
    const router = useRouter();
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to admin page on success
                router.push('/admin');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-pink-100 to-white px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-56 h-20 relative mx-auto mb-4">
                        <Image
                            src="/Cakeland.png"
                            alt="Cakeland Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <p className="text-xl text-gray-600 font-light">Admin Panel</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <h2 className="text-2xl font-serif font-bold text-[#E46296] mb-6 text-center">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Admin ID Field */}
                        <div>
                            <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 mb-2">
                                Admin ID
                            </label>
                            <input
                                type="text"
                                id="adminId"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#E46296] focus:ring-2 focus:ring-[#E46296]/20 transition-all outline-none text-gray-800 placeholder-gray-400"
                                placeholder="Enter your admin ID"
                                disabled={loading}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-gray-200 focus:border-[#E46296] focus:ring-2 focus:ring-[#E46296]/20 transition-all outline-none text-gray-800 placeholder-gray-400"
                                    placeholder="Enter your password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#E46296] text-white font-bold py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <a href="/" className="text-sm text-gray-600 hover:text-[#E46296] transition-colors font-medium">
                        ← Back to Cakeland
                    </a>
                </div>
            </div>
        </div>
    );
}
