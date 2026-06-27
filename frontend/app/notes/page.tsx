"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, API_URL } from "../../lib/api";

type Note = {
  id: number;
  title: string;
  content: string;
  color: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
};

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");

  const colors = ["#ffffff", "#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#ede9fe"];

  async function fetchNotes() {
    try {
      const res = await authFetch(`${API_URL}/notes${search ? `?search=${search}` : ""}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotes(); }, [search]);

  async function handleSave() {
    if (!title.trim()) return;

    if (editNote) {
      await authFetch(`${API_URL}/notes/${editNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, color }),
      });
    } else {
      await authFetch("${API_URL}/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, color }),
      });
    }

    setTitle("");
    setContent("");
    setColor("#ffffff");
    setEditNote(null);
    setShowForm(false);
    fetchNotes();
  }

  async function handleDelete(id: number) {
    await authFetch(`${API_URL}/notes/${id}`, { method: "DELETE" });
    fetchNotes();
  }

  async function handlePin(note: Note) {
    await authFetch(`${API_URL}/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !note.is_pinned }),
    });
    fetchNotes();
  }

  function openEdit(note: Note) {
    setEditNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">📝 Заметки</h1>
          <button
            onClick={() => { setShowForm(true); setEditNote(null); setTitle(""); setContent(""); setColor("#ffffff"); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Новая заметка
          </button>
        </div>

        {/* Поиск */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск заметок..."
          className="w-full border rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Форма создания/редактирования */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold mb-4">{editNote ? "Редактировать" : "Новая заметка"}</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Заголовок"
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Текст заметки..."
              rows={4}
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex gap-2 mb-4">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-blue-500" : "border-gray-200"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                Сохранить
              </button>
              <button onClick={() => { setShowForm(false); setEditNote(null); }} className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список заметок */}
        {notes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>Заметок пока нет — создайте первую!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl p-4 shadow-sm border border-gray-100 relative"
                style={{ backgroundColor: note.color }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm flex-1 pr-2">{note.title}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handlePin(note)} className="text-lg" title={note.is_pinned ? "Открепить" : "Закрепить"}>
                      {note.is_pinned ? "📌" : "📍"}
                    </button>
                    <button onClick={() => openEdit(note)} className="text-gray-400 hover:text-gray-600 text-sm px-1">✏️</button>
                    <button onClick={() => handleDelete(note.id)} className="text-gray-400 hover:text-red-500 text-sm px-1">🗑️</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(note.updated_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}