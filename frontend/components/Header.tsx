"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Логотип */}
        <Link href="/dashboard" className="font-bold text-lg text-blue-600">
          SuperApp
        </Link>

        {/* Навигация */}
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Главная
          </Link>
          <Link href="/profile" className="hover:text-blue-600 transition-colors">
            Профиль
          </Link>
          <Link href="/wallet" className="hover:text-blue-600 transition-colors">
            Кошелёк
          </Link>
        </nav>

        {/* Выйти */}
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Выйти
        </button>

      </div>
    </header>
  );
}