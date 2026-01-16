import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
    const router = useRouter();

    const handleLogout = () => {
        // Clear credentials
        localStorage.removeItem('admin_authenticated');
        router.push('/admin/login');
    };

    return (
        <div className="bg-[#E46296] h-20 md:h-24 sticky top-0 z-40 shadow-lg flex items-center justify-between px-4 md:px-10">
            {/* Logo */}
            <div className="w-44 h-16 md:w-56 md:h-20 relative -ml-2 md:ml-0">
                <Image
                    src="/Cakeland.png"
                    alt="Cakeland Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-3 md:gap-6 text-white">
                <Link
                    href="/admin"
                    className="font-semibold uppercase text-sm md:text-base tracking-wide hover:bg-white/10 px-3 md:px-4 py-2 rounded-lg transition"
                >
                    📤 Upload
                </Link>

                <div className="h-6 w-px bg-white/50"></div>

                <Link
                    href="/admin/gallery"
                    className="font-semibold uppercase text-sm md:text-base tracking-wide hover:bg-white/10 px-3 md:px-4 py-2 rounded-lg transition"
                >
                    🖼️ Gallery
                </Link>

                <div className="h-6 w-px bg-white/50"></div>

                <button
                    onClick={handleLogout}
                    className="font-semibold uppercase text-sm md:text-base tracking-wide bg-white/10 hover:bg-white hover:text-[#E46296] px-4 md:px-6 py-2 rounded-full transition-all duration-300"
                >
                    Logout
                </button>
            </nav>
        </div>
    );
}
