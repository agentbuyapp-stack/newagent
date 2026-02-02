"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApiClient } from "@/lib/useApiClient";
import type { Banner, BannerType, BannerTarget } from "@/lib/api";

export default function BannerManager() {
  const apiClient = useApiClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    type: "image" as BannerType,
    url: "",
    thumbnailUrl: "",
    isActive: true,
    order: 0,
    targetAudience: "all" as BannerTarget,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAllBanners();
      if (response.success) {
        setBanners(response.data.map(b => ({ ...b, id: b._id || b.id })));
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      type: "image",
      url: "",
      thumbnailUrl: "",
      isActive: true,
      order: 0,
      targetAudience: "all",
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      type: banner.type,
      url: banner.url,
      thumbnailUrl: banner.thumbnailUrl || "",
      isActive: banner.isActive,
      order: banner.order,
      targetAudience: banner.targetAudience,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "url" | "thumbnailUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Зураг 5MB-аас бага байх ёстой" });
      return;
    }

    setUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const response = await apiClient.uploadImage(base64);
        setFormData(prev => ({ ...prev, [field]: response.imageUrl }));
        setMessage({ type: "success", text: "Зураг амжилттай upload хийгдлээ" });
        setUploadLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Зураг upload хийхэд алдаа гарлаа" });
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      setMessage({ type: "error", text: "Гарчиг шаардлагатай" });
      return;
    }

    // For image type, url is required (the main banner image)
    if (formData.type === "image" && !formData.url && !formData.thumbnailUrl) {
      setMessage({ type: "error", text: "Зураг оруулна уу" });
      return;
    }

    // For video type, url is required
    if (formData.type === "video" && !formData.url) {
      setMessage({ type: "error", text: "YouTube URL шаардлагатай" });
      return;
    }

    // For link type, url is required
    if (formData.type === "link" && !formData.url) {
      setMessage({ type: "error", text: "Линк URL шаардлагатай" });
      return;
    }

    setFormLoading(true);
    setMessage(null);

    try {
      // For image type, if only thumbnailUrl is set, use it as url too
      const submitData = { ...formData };
      if (formData.type === "image" && !formData.url && formData.thumbnailUrl) {
        submitData.url = formData.thumbnailUrl;
      }

      if (editingBanner) {
        const response = await apiClient.updateBanner(editingBanner.id, submitData);
        setMessage({ type: "success", text: response.message });
      } else {
        const response = await apiClient.createBanner(submitData);
        setMessage({ type: "success", text: response.message });
      }
      resetForm();
      fetchBanners();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Алдаа гарлаа" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ баннерыг устгах уу?")) return;

    try {
      const response = await apiClient.deleteBanner(id);
      setMessage({ type: "success", text: response.message });
      fetchBanners();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Устгахад алдаа гарлаа" });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await apiClient.toggleBannerStatus(id);
      setMessage({ type: "success", text: response.message });
      fetchBanners();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Алдаа гарлаа" });
    }
  };

  const getTypeLabel = (type: BannerType) => {
    switch (type) {
      case "video": return "Видео";
      case "image": return "Зураг";
      case "link": return "Линк";
    }
  };

  const getTargetLabel = (target: BannerTarget) => {
    switch (target) {
      case "all": return "Бүгд";
      case "user": return "Хэрэглэгч";
      case "agent": return "Агент";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Баннер удирдлага
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showForm ? "Хаах" : "+ Шинэ баннер"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-red-100 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            {editingBanner ? "Баннер засах" : "Шинэ баннер нэмэх"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Гарчиг *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Зааварчилгаа сургалт"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Дэд гарчиг</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="YouTube видео үзэх"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Төрөл *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as BannerType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="image">Зураг</option>
                  <option value="video">Видео (YouTube)</option>
                  <option value="link">Линк</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Харуулах</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as BannerTarget })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="all">Бүгдэд</option>
                  <option value="user">Зөвхөн хэрэглэгчид</option>
                  <option value="agent">Зөвхөн агент</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Дараалал</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {formData.type === "image" ? "Баннер зураг *" : formData.type === "video" ? "YouTube URL *" : "Линк URL *"}
              </label>

              {formData.type === "video" ? (
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              ) : formData.type === "link" ? (
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              ) : (
                <div className="space-y-2">
                  {/* Image preview */}
                  {(formData.url || formData.thumbnailUrl) && (
                    <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={formData.url || formData.thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, url: "", thumbnailUrl: "" })}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Upload button */}
                  {!formData.url && !formData.thumbnailUrl && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      {uploadLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-gray-600">Upload хийж байна...</span>
                        </div>
                      ) : (
                        <>
                          <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-600">Зураг сонгох</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (max 5MB)</p>
                        </>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "url")}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail for video/link type */}
            {(formData.type === "video" || formData.type === "link") && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">Thumbnail зураг (заавал биш)</label>
                {formData.thumbnailUrl ? (
                  <div className="relative w-48 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnailUrl: "" })}
                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "thumbnailUrl")}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Идэвхтэй</label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formLoading || uploadLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {formLoading ? "Хадгалж байна..." : editingBanner ? "Шинэчлэх" : "Нэмэх"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Цуцлах
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : banners.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {banners.map((banner) => (
              <div key={banner.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                {/* Thumbnail */}
                <div className="w-24 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {banner.thumbnailUrl || banner.url ? (
                    <img
                      src={banner.thumbnailUrl || banner.url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{banner.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      banner.type === "video" ? "bg-red-100 text-red-700" :
                      banner.type === "image" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {getTypeLabel(banner.type)}
                    </span>
                    <span className="text-xs text-gray-500">{getTargetLabel(banner.targetAudience)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(banner.id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      banner.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {banner.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Баннер байхгүй. Шинээр нэмнэ үү.
          </div>
        )}
      </div>
    </div>
  );
}
