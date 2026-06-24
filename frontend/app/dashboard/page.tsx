"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMe } from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    getMe(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.push("/login");
      });
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  const services = [
    { icon: "💳", title: "Кошелёк", desc: "Баланс, пополнение, история операций", href: "/wallet", ready: true },
    { icon: "🛍️", title: "Маркетплейс", desc: "Товары, категории, корзина, заказы", href: "/market", ready: false },
    { icon: "👤", title: "Профиль", desc: "Имя, телефон, настройки аккаунта", href: "/profile", ready: true },
    { icon: "📦", title: "Доставка", desc: "Заказы и отслеживание", href: "/delivery", ready: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-semibold">Добро пожаловать 👋</h1>
          <p className="text-sm text-gray-500">{user.full_name || user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {services.map((s) =>
            s.ready ? (
              <Link key={s.title} href={s.href}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 mb-2">{s.desc}</div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Доступно</span>
              </Link>
            ) : (
              <div key={s.title}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 opacity-60 cursor-not-allowed"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 mb-2">{s.desc}</div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Скоро</span>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}