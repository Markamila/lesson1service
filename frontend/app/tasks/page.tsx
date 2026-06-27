"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, API_URL } from "../../lib/api";

type Task = {
  id: number;
  title: string;
  description: string;
  is_done: boolean;
  priority: "low" | "medium" | "high";
  deadline: string | null;
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [deadline, setDeadline] = useState("");

  const priorityConfig = {
    low: { label: "Низкий", color: "bg-gray-100 text-gray-600" },
    medium: { label: "Средний", color: "bg-yellow-100 text-yellow-700" },
    high: { label: "Высокий", color: "bg-red-100 text-red-600" },
  };

  async function fetchTasks() {
    try {
      const params = filter === "active" ? "?done=false" : filter === "done" ? "?done=true" : "";
      const res = await authFetch(`${API_URL}/tasks${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, [filter]);

  async function handleCreate() {
    if (!title.trim()) return;

    await authFetch("${API_URL}/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, priority, deadline: deadline || null }),
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDeadline("");
    setShowForm(false);
    fetchTasks();
  }

  async function handleToggle(task: Task) {
    await authFetch(`${API_URL}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !task.is_done }),
    });
    fetchTasks();
  }

  async function handleDelete(id: number) {
    await authFetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">✅ Задачи</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Новая задача
          </button>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 mb-6">
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "Все" : f === "active" ? "Активные" : "Выполненные"}
            </button>
          ))}
        </div>

        {/* Форма */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold mb-4">Новая задача</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              rows={2}
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Дедлайн</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                Создать
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список задач */}
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">✅</p>
            <p>{filter === "done" ? "Выполненных задач нет" : "Задач пока нет — создайте первую!"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-xl p-4 shadow-sm border flex items-start gap-3 ${task.is_done ? "opacity-60" : ""}`}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    task.is_done ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {task.is_done && "✓"}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${task.is_done ? "line-through text-gray-400" : ""}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[task.priority].color}`}>
                      {priorityConfig[task.priority].label}
                    </span>
                    {task.deadline && (
                      <span className={`text-xs ${isOverdue(task.deadline) && !task.is_done ? "text-red-500 font-medium" : "text-gray-400"}`}>
                        📅 {new Date(task.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {isOverdue(task.deadline) && !task.is_done && " — просрочено"}
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={() => handleDelete(task.id)} className="text-gray-300 hover:text-red-500 text-sm flex-shrink-0">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}