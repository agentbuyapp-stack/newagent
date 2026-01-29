"use client";

import { useState, useEffect } from "react";
import { type AgentSpecialty } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface SpecialtyManagerProps {
  onSpecialtiesChange?: (specialties: AgentSpecialty[]) => void;
}

export default function SpecialtyManager({ onSpecialtiesChange }: SpecialtyManagerProps) {
  const apiClient = useApiClient();
  const [specialties, setSpecialties] = useState<AgentSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    icon: "",
    description: "",
  });

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await apiClient.getAdminSpecialties();
      setSpecialties(data);
      onSpecialtiesChange?.(data);
    } catch (err) {
      console.error("Error loading specialties:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", nameEn: "", icon: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (specialty: AgentSpecialty) => {
    setFormData({
      name: specialty.name,
      nameEn: specialty.nameEn || "",
      icon: specialty.icon || "",
      description: specialty.description || "",
    });
    setEditingId(specialty.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Нэр оруулна уу");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await apiClient.updateSpecialty(editingId, formData);
      } else {
        await apiClient.createSpecialty(formData);
      }
      await loadSpecialties();
      resetForm();
    } catch (err: any) {
      console.error("Error saving specialty:", err);
      alert(err.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ мэргэжлийг устгах уу?")) return;

    try {
      await apiClient.deleteSpecialty(id);
      await loadSpecialties();
    } catch (err) {
      console.error("Error deleting specialty:", err);
      alert("Устгахад алдаа гарлаа");
    }
  };

  const handleToggleActive = async (specialty: AgentSpecialty) => {
    try {
      await apiClient.updateSpecialty(specialty.id, {
        isActive: !(specialty.isActive ?? true),
      });
      await loadSpecialties();
    } catch (err) {
      console.error("Error toggling active:", err);
      alert("Алдаа гарлаа");
    }
  };

  const commonIcons = ["👔", "📱", "💄", "👟", "🏠", "🎮", "📚", "🍎", "💊", "🛒", "🎁", "✈️"];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Мэргэжлийн чиглэлүүд ({specialties.length})
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Нэмэх
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h4 className="text-lg font-semibold mb-4">
              {editingId ? "Мэргэжил засах" : "Шинэ мэргэжил нэмэх"}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Нэр (Монгол) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Хувцас"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Нэр (Англи)
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Clothing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дүрс (Emoji)
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                      className={`w-8 h-8 text-lg rounded hover:bg-gray-100 ${
                        formData.icon === icon ? "bg-blue-100 ring-2 ring-blue-500" : ""
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="👔"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тайлбар
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Хувцас, гутал, аксессуар..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialties List */}
      {specialties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Мэргэжил бүртгээгүй байна</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-500 hover:underline"
          >
            Эхний мэргэжлийг нэмэх
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialties.map((specialty) => (
            <div
              key={specialty.id}
              className={`p-4 rounded-lg border ${
                specialty.isActive === false
                  ? "bg-gray-50 border-gray-200 opacity-60"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{specialty.icon || "📦"}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{specialty.name}</h4>
                    {specialty.nameEn && (
                      <p className="text-sm text-gray-500">{specialty.nameEn}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleActive(specialty)}
                    className={`p-1.5 rounded hover:bg-gray-100 ${
                      specialty.isActive === false ? "text-gray-400" : "text-green-500"
                    }`}
                    title={specialty.isActive === false ? "Идэвхжүүлэх" : "Идэвхгүй болгох"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(specialty)}
                    className="p-1.5 text-blue-500 rounded hover:bg-blue-50"
                    title="Засах"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(specialty.id)}
                    className="p-1.5 text-red-500 rounded hover:bg-red-50"
                    title="Устгах"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {specialty.description && (
                <p className="mt-2 text-sm text-gray-500">{specialty.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
