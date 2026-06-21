const API_URL = "http://localhost:4000";

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка входа");
  return data;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось обновить токен");
  return data;
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) {
    // Токен истёк — пробуем обновить
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("Сессия истекла");

    const { accessToken } = await refreshAccessToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);

    // Повторяем запрос с новым токеном
    const retryRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const retryData = await retryRes.json();
    if (!retryRes.ok) throw new Error(retryData.error || "Ошибка авторизации");
    return retryData;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка авторизации");
  return data;
}