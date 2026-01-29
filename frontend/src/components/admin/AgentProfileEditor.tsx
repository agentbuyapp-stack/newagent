"use client";

import { useState } from "react";
import { type User, type AgentProfileData, type AgentSpecialty } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface AgentProfileEditorProps {
  agent: User;
  specialties: AgentSpecialty[];
  onUpdate: (agent: User) => void;
  onClose: () => void;
}

export default function AgentProfileEditor({
  agent,
  specialties,
  onUpdate,
  onClose,
}: AgentProfileEditorProps) {
  const apiClient = useApiClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<AgentProfileData>({
    avatarUrl: (agent as any).agentProfile?.avatarUrl || "",
    displayName: (agent as any).agentProfile?.displayName || agent.profile?.name || "",
    bio: (agent as any).agentProfile?.bio || "",
    specialties: (agent as any).agentProfile?.specialties || [],
    experienceYears: (agent as any).agentProfile?.experienceYears || 0,
    languages: (agent as any).agentProfile?.languages || [],
    responseTime: (agent as any).agentProfile?.responseTime || "",
    workingHours: (agent as any).agentProfile?.workingHours || "",
    availabilityStatus: (agent as any).agentProfile?.availabilityStatus || "offline",
    featured: (agent as any).agentProfile?.featured || false,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Зөвхөн зураг оруулах боломжтой");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Зурагны хэмжээ 5MB-аас бага байх ёстой");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await apiClient.uploadImage(base64);
          setFormData((prev) => ({ ...prev, avatarUrl: result.imageUrl }));
        } catch (err) {
          console.error("Upload error:", err);
          alert("Зураг upload хийхэд алдаа гарлаа");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      alert("Зураг уншихад алдаа гарлаа");
    }
  };

  const handleSpecialtyToggle = (specialtyName: string) => {
    setFormData((prev) => {
      const current = prev.specialties || [];
      if (current.includes(specialtyName)) {
        return { ...prev, specialties: current.filter((s) => s !== specialtyName) };
      } else {
        return { ...prev, specialties: [...current, specialtyName] };
      }
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const languages = e.target.value.split(",").map((l) => l.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, languages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedAgent = await apiClient.updateAgentProfile(agent.id, formData);
      onUpdate(updatedAgent);
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Профайл шинэчлэхэд алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Агентын профайл засах
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Профайл зураг
              </label>
              <div className="flex items-center gap-4">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">
                      {formData.displayName?.[0]?.toUpperCase() || "A"}
                    </span>
                  </div>
                )}
                <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100">
                  {uploading ? "Уншиж байна..." : "Зураг сонгох"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Харуулах нэр
              </label>
              <input
                type="text"
                value={formData.displayName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Жишээ: Болд"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Танилцуулга (500 тэмдэгт хүртэл)
              </label>
              <textarea
                value={formData.bio || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                maxLength={500}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Агентын танилцуулга..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.bio || "").length}/500
              </p>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Мэргэжлийн чиглэлүүд
              </label>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <button
                    key={specialty.id}
                    type="button"
                    onClick={() => handleSpecialtyToggle(specialty.name)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.specialties?.includes(specialty.name)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {specialty.icon && <span className="mr-1">{specialty.icon}</span>}
                    {specialty.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Туршлага (жилээр)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experienceYears || 0}
                onChange={(e) => setFormData((prev) => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Хэлүүд (таслалаар тусгаарлана)
              </label>
              <input
                type="text"
                value={(formData.languages || []).join(", ")}
                onChange={handleLanguageChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Монгол, Англи, Хятад"
              />
            </div>

            {/* Response Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Хариу өгөх хугацаа
              </label>
              <input
                type="text"
                value={formData.responseTime || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, responseTime: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="< 1 цаг"
              />
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ажиллах цаг
              </label>
              <input
                type="text"
                value={formData.workingHours || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, workingHours: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="09:00 - 18:00"
              />
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Төлөв
              </label>
              <select
                value={formData.availabilityStatus || "offline"}
                onChange={(e) => setFormData((prev) => ({ ...prev, availabilityStatus: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="online">Онлайн</option>
                <option value="busy">Завгүй</option>
                <option value="offline">Офлайн</option>
              </select>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Онцлох агент
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
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
    </div>
  );
}
