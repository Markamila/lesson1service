"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "../../lib/api";

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<string>("0.00");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchWallet() {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    try {
      const res = await authFetch("http://localhost:4000/wallet");
      const data = await res.json();
      setBalance(data.balance || "0.00");
      setTransactions(data.transactions || []);
    } catch (err) {
      setTransactions([]);
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => { fetchWallet(); }, []);

  async function handleDeposit() {
    await handleOperation("deposit");
  }

  async function handleWithdrawal() {
    await handleOperation("withdrawal");
  }

  async function handleOperation(type: "deposit" | "withdrawal") {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Введите сумму больше нуля");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(`http://localhost:4000/wallet/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), description }),
    });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка операции");

      setSuccess(data.message);
      setAmount("");
      setDescription("");
      await fetchWallet();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Баланс */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Текущий баланс</p>
          <p className="text-4xl font-bold">{parseFloat(balance).toLocaleString()} ₸</p>
        </div>

        {/* Операции */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold mb-4">Операция</h2>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{success}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Сумма (₸)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Описание (необязательно)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Зарплата"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDeposit}
              disabled={loading}
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              + Пополнить
            </button>
            <button
              onClick={handleWithdrawal}
              disabled={loading}
              className="bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50 font-medium"
            >
              - Списать
            </button>
          </div>
        </div>

        {/* История транзакций */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold mb-4">История операций</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Операций пока нет</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${t.type === "deposit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                      {t.type === "deposit" ? "↑" : "↓"}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.description}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <span className={`font-semibold ${t.type === "deposit" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "deposit" ? "+" : "-"}{parseFloat(t.amount).toLocaleString()} ₸
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}