"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, API_URL } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    authFetch(`${API_URL}/profile`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setFullName(data.user.full_name || "");
        setPhone(data.user.phone || "");
        setBirthDate(data.user.birth_date ? data.user.birth_date.split("T")[0] : "");
        setGender(data.user.gender || "");
        setAvatarUrl(data.user.avatar_url || "");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const res = await authFetch(`${API_URL}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, phone, birth_date: birthDate || null, gender: gender || null, avatar_url: avatarUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
      setUser(data.user);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await authFetch(`${API_URL}/upload/avatar`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setAvatarUrl(data.avatar_url);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePasswordChange() {
    setPassLoading(true);
    setPassSuccess(false);
    setPassError("");
    try {
      const res = await authFetch(`${API_URL}/profile/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка смены пароля");
      setPassSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPassError(err.message);
    } finally {
      setPassLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto space-y-6">

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                {(user.full_name || user.email)[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-lg">{user.full_name || "Имя не указано"}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{user.role}</span>
            </div>
          </div>

          <h2 className="font-semibold mb-4">Основная информация</h2>

          {saveSuccess && <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">Сохранено ✓</div>}
          {saveError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{saveError}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input value={user.email} disabled className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Введите имя" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Телефон</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 000 000 00 00" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата рождения</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Пол</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Фото профиля</label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                )}
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-sm px-4 py-2 rounded-lg transition-colors">
                  Выбрать фото
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {uploadingAvatar && <span className="text-sm text-gray-500">Загрузка...</span>}
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold mb-4">Смена пароля</h2>

          {passSuccess && <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">Пароль изменён ✓</div>}
          {passError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{passError}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Текущий пароль</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Новый пароль</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button onClick={handlePasswordChange} disabled={passLoading} className="mt-6 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 disabled:opacity-50">
            {passLoading ? "Сохранение..." : "Изменить пароль"}
          </button>
        </div>

      </div>
    </div>
  );
}