"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { AdminSettings, AdminSettingsData, GalleryItem } from "@/lib/api";
import { apiClient as apiClientInstance } from "@/lib/api";

interface SettingsTabProps {
  adminSettings: AdminSettings | null;
  settingsFormData: AdminSettingsData;
  onSettingsFormChange: (data: AdminSettingsData) => void;
  savingSettings: boolean;
  settingsSaved: boolean;
  onSaveSettings: (formData: AdminSettingsData, onSuccess: () => void) => Promise<void>;
  apiClient: typeof apiClientInstance;
}

export function SettingsTab({
  adminSettings,
  settingsFormData,
  onSettingsFormChange,
  savingSettings,
  settingsSaved,
  onSaveSettings,
  apiClient,
}: SettingsTabProps) {
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const handleEditSettings = () => {
    setIsEditingSettings(true);
  };

  const handleSaveSettings = async () => {
    await onSaveSettings(settingsFormData, () => {
      setIsEditingSettings(false);
    });
  };

  const handleCancelEdit = () => {
    setIsEditingSettings(false);
    onSettingsFormChange({
      accountNumber: adminSettings?.accountNumber || "",
      accountName: adminSettings?.accountName || "",
      bank: adminSettings?.bank || "",
      exchangeRate: adminSettings?.exchangeRate || 1,
      orderLimitEnabled: true,
      maxOrdersPerDay: adminSettings?.maxOrdersPerDay ?? 10,
      maxActiveOrders: adminSettings?.maxActiveOrders ?? 10,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Тохиргоо
        </h3>
        {!isEditingSettings && (
          <button
            onClick={handleEditSettings}
            className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
          >
            Засах
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          Төлбөрийн дансны мэдээлэл
        </h4>

        {settingsSaved && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
            ✓ Тохиргоо амжилттай хадгалагдлаа
          </div>
        )}

        {isEditingSettings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Дансны дугаар
              </label>
              <input
                type="text"
                value={settingsFormData.accountNumber || ""}
                onChange={(e) =>
                  onSettingsFormChange({
                    ...settingsFormData,
                    accountNumber: e.target.value,
                  })
                }
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Жишээ: 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Дансны нэр
              </label>
              <input
                type="text"
                value={settingsFormData.accountName || ""}
                onChange={(e) =>
                  onSettingsFormChange({
                    ...settingsFormData,
                    accountName: e.target.value,
                  })
                }
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Жишээ: Agentbuy.mn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Банк
              </label>
              <input
                type="text"
                value={settingsFormData.bank || ""}
                onChange={(e) =>
                  onSettingsFormChange({
                    ...settingsFormData,
                    bank: e.target.value,
                  })
                }
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Жишээ: Хаан банк"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Ханш (Exchange Rate)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settingsFormData.exchangeRate || 1}
                onChange={(e) =>
                  onSettingsFormChange({
                    ...settingsFormData,
                    exchangeRate: parseFloat(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Жишээ: 1.0"
              />
              <p className="text-xs text-gray-500 mt-1">
                User-д харагдах дүн = Agent report дүн × Ханш × 1.05
              </p>
            </div>

            {/* Захиалгын хязгаарлалт */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">
                Захиалгын хязгаарлалт
              </h5>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Өдөрт максимум захиалга
                </label>
                <input
                  type="number"
                  min="1"
                  value={settingsFormData.maxOrdersPerDay || 10}
                  onChange={(e) =>
                    onSettingsFormChange({
                      ...settingsFormData,
                      maxOrdersPerDay: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Нэг хэрэглэгч өдөрт хамгийн ихдээ хэдэн захиалга үүсгэж болох
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex-1 px-4 py-2.5 text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
              >
                {savingSettings ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2.5 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-11"
              >
                Цуцлах
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Дансны дугаар
              </label>
              <p className="text-gray-900 font-mono">
                {adminSettings?.accountNumber || "Тохируулаагүй"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Дансны нэр
              </label>
              <p className="text-gray-900">
                {adminSettings?.accountName || "Тохируулаагүй"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Банк
              </label>
              <p className="text-gray-900">
                {adminSettings?.bank || "Тохируулаагүй"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Ханш (Exchange Rate)
              </label>
              <p className="text-gray-900">{adminSettings?.exchangeRate || 1}</p>
            </div>

            {/* Захиалгын хязгаарлалт харах */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">
                Захиалгын хязгаарлалт
              </h5>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Өдөрт максимум:
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {adminSettings?.maxOrdersPerDay ?? 10} захиалга
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Images Section */}
      <GallerySection
        adminSettings={adminSettings}
        settingsFormData={settingsFormData}
        onSaveSettings={onSaveSettings}
        apiClient={apiClient}
      />

    </div>
  );
}

/* ─── Gallery Section with captions ─── */
function GallerySection({
  adminSettings,
  settingsFormData,
  onSaveSettings,
  apiClient,
}: {
  adminSettings: AdminSettings | null;
  settingsFormData: AdminSettingsData;
  onSaveSettings: (formData: AdminSettingsData, onSuccess: () => void) => Promise<void>;
  apiClient: typeof apiClientInstance;
}) {
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingGallery, setSavingGallery] = useState(false);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [captionText, setCaptionText] = useState("");

  // Get gallery items (prefer galleryItems, fall back to galleryImages)
  const getItems = (): GalleryItem[] => {
    if (adminSettings?.galleryItems && adminSettings.galleryItems.length > 0) {
      return adminSettings.galleryItems;
    }
    return (adminSettings?.galleryImages || []).map(url => ({ url, caption: "" }));
  };

  const items = getItems();

  const saveItems = async (updated: GalleryItem[]) => {
    setSavingGallery(true);
    try {
      await onSaveSettings({ ...settingsFormData, galleryItems: updated }, () => {});
    } finally {
      setSavingGallery(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white mt-4">
      <h4 className="text-base font-semibold text-gray-900 mb-2">
        Галерей зурагнууд
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        Нүүр хуудасны галерей хэсэгт харагдах зурагнууд (бидний хийсэн ажлууд)
      </p>

      {/* Current images */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={item.url} alt={item.caption || `Gallery ${idx + 1}`} className="w-full h-40 object-cover" />

              {/* Caption display / edit */}
              {editingCaption === idx ? (
                <div className="p-2 space-y-2">
                  <input
                    type="text"
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Тайлбар бичих..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const updated = [...items];
                        updated[idx] = { ...updated[idx], caption: captionText };
                        saveItems(updated);
                        setEditingCaption(null);
                      } else if (e.key === "Escape") {
                        setEditingCaption(null);
                      }
                    }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const updated = [...items];
                        updated[idx] = { ...updated[idx], caption: captionText };
                        saveItems(updated);
                        setEditingCaption(null);
                      }}
                      className="flex-1 px-2 py-1.5 text-xs text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Хадгалах
                    </button>
                    <button
                      onClick={() => setEditingCaption(null)}
                      className="px-2 py-1.5 text-xs text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Цуцлах
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setEditingCaption(idx);
                    setCaptionText(item.caption || "");
                  }}
                >
                  {item.caption ? (
                    <p className="text-sm text-gray-800 line-clamp-2">{item.caption}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Тайлбар нэмэх...</p>
                  )}
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={async () => {
                  if (!confirm("Энэ зургийг устгах уу?")) return;
                  const updated = items.filter((_, i) => i !== idx);
                  await saveItems(updated);
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <label className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors ${
        uploadingGallery || savingGallery
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}>
        {uploadingGallery ? (
          "Зураг уншиж байна..."
        ) : savingGallery ? (
          "Хадгалж байна..."
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Зураг нэмэх
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploadingGallery || savingGallery}
          className="hidden"
          onChange={async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            setUploadingGallery(true);
            try {
              const newItems: GalleryItem[] = [];
              for (const file of Array.from(files)) {
                if (file.size > 5 * 1024 * 1024) {
                  alert(`"${file.name}" 5MB-аас их байна, алгасаж байна`);
                  continue;
                }
                // Ask for caption
                const caption = prompt(`"${file.name}" зургийн тайлбар (хоосон орхиж болно):`, "") ?? "";
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
                const result = await apiClient.uploadImage(base64);
                newItems.push({ url: result.imageUrl, caption });
              }
              if (newItems.length > 0) {
                const updated = [...items, ...newItems];
                setSavingGallery(true);
                await saveItems(updated);
              }
            } catch (err) {
              console.error("Gallery upload error:", err);
              alert("Зураг upload хийхэд алдаа гарлаа");
            } finally {
              setUploadingGallery(false);
              setSavingGallery(false);
              e.target.value = "";
            }
          }}
        />
      </label>

      <p className="text-xs text-gray-500 mt-2">
        Зураг бүр 5MB-аас бага байх ёстой. Олон зураг нэг дор сонгож болно. Зураг дээр дарж тайлбар засах боломжтой.
      </p>
    </div>
  );
}
