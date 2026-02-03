"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface KnowledgeEntry {
  _id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
}

export default function KnowledgeBaseTab() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // System prompt state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
    keywords: "",
  });

  // Fetch knowledge base entries
  const fetchEntries = async () => {
    try {
      const response = await fetch(`${API_URL}/support/knowledge`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge base:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch system prompt
  const fetchSystemPrompt = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/support/system-prompt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.prompt);
      }
    } catch (err) {
      console.error("Failed to fetch system prompt:", err);
    }
  };

  // Save system prompt
  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    setPromptSaved(false);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/support/system-prompt`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: systemPrompt }),
      });
      if (response.ok) {
        setPromptSaved(true);
        setTimeout(() => setPromptSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save system prompt:", err);
    } finally {
      setSavingPrompt(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchSystemPrompt();
  }, []);

  // Add new entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.question || !formData.answer) {
      setError("Бүх талбарыг бөглөнө үү");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/support/knowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setEntries([newEntry, ...entries]);
        setFormData({ category: "", question: "", answer: "", keywords: "" });
        setShowForm(false);
      } else {
        const data = await response.json();
        setError(data.error || "Алдаа гарлаа");
      }
    } catch (err) {
      setError("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    if (!confirm("Устгахдаа итгэлтэй байна уу?")) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/support/knowledge/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEntries(entries.filter((e) => e._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Group entries by category
  const groupedEntries = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    },
    {} as Record<string, KnowledgeEntry[]>
  );

  const categories = [
    { value: "orders", label: "Захиалга" },
    { value: "payment", label: "Төлбөр" },
    { value: "shipping", label: "Хүргэлт" },
    { value: "agent", label: "Agent" },
    { value: "refund", label: "Буцаалт" },
    { value: "contact", label: "Холбоо барих" },
    { value: "price", label: "Үнэ" },
    { value: "other", label: "Бусад" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Knowledge Base
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            AI туслахын мэдлэгийн сан - {entries.length} бичлэг
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Шинэ нэмэх
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Шинэ мэдлэг нэмэх
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Категори
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Сонгох...</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Түлхүүр үгс (таслалаар тусгаарлах)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="захиалга, order, өгөх"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Асуулт
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Захиалга хэрхэн өгөх вэ?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Хариулт
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={4}
                placeholder="Дэлгэрэнгүй хариулт бичнэ үү..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
              >
                Болих
              </button>
            </div>
          </form>
        </div>
      )}

      {/* System Prompt Editor */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">System Prompt</h3>
          </div>
          {promptSaved && (
            <span className="text-sm text-green-600 dark:text-green-400">Хадгалагдлаа!</span>
          )}
        </div>
        <p className="text-xs text-purple-600 dark:text-purple-300 mb-3">
          AI-ийн зан авир, хариулах хэв маягийг тодорхойлно. <code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">{"{{knowledge_base}}"}</code> гэсэн хэсэгт доорх мэдлэгүүд орно.
        </p>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-purple-500"
          placeholder="System prompt..."
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSavePrompt}
            disabled={savingPrompt}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
          >
            {savingPrompt ? "Хадгалж байна..." : "Prompt хадгалах"}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>AI хэрхэн сурдаг вэ?</strong>
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Энд нэмсэн асуулт-хариултууд AI-д system prompt-аар дамжуулагддаг. AI эдгээр мэдээллийг ашиглан хэрэглэгчдэд хариу өгнө. Илүү дэлгэрэнгүй, тодорхой хариулт бичих тусам AI илүү сайн хариу өгнө.
            </p>
          </div>
        </div>
      </div>

      {/* Entries list */}
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([category, categoryEntries]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {categories.find((c) => c.value === category)?.label || category} ({categoryEntries.length})
            </h3>
            <div className="space-y-3">
              {categoryEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {entry.question}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">
                        {entry.answer}
                      </p>
                      {entry.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {entry.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Устгах"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          Knowledge base хоосон байна. Дээрх товч дээр дарж мэдлэг нэмнэ үү.
        </div>
      )}
    </div>
  );
}
