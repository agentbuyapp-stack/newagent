/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { type BundleOrder, type BundleReportData } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface ApiClientLike {
  getHeaders: () => Promise<HeadersInit>;
}

// Upload image via backend API
async function uploadImageToCloudinary(base64Data: string, apiClient: ApiClientLike): Promise<{ url: string }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const headers = await apiClient.getHeaders();

  const response = await fetch(`${API_BASE_URL}/upload-image`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to upload image");
  }

  return response.json();
}

interface BundleReportFormProps {
  bundleOrder: BundleOrder;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ItemReportForm {
  userAmount: number;
  paymentLink: string;
  additionalDescription: string;
  quantity?: number;
}

export default function BundleReportForm({ bundleOrder, onSuccess, onCancel }: BundleReportFormProps) {
  const apiClient = useApiClient();

  // Determine initial report mode from existing data
  const existingReportMode = bundleOrder.reportMode || "single";

  // Report mode: "single" = one price for whole bundle, "per_item" = price for each item
  const [reportMode, setReportMode] = useState<"single" | "per_item">(existingReportMode);

  // Single mode form data - initialize from existing bundleReport if available
  const [singleFormData, setSingleFormData] = useState({
    totalUserAmount: bundleOrder.bundleReport?.totalUserAmount || 0,
    paymentLink: bundleOrder.bundleReport?.paymentLink || "",
    additionalDescription: bundleOrder.bundleReport?.additionalDescription || "",
  });
  const [singleImagePreviews, setSingleImagePreviews] = useState<string[]>(
    bundleOrder.bundleReport?.additionalImages || []
  );
  const [singleImageUrls, setSingleImageUrls] = useState<string[]>(
    bundleOrder.bundleReport?.additionalImages || []
  );

  // Per-item mode form data - initialize from existing item reports if available
  const [itemForms, setItemForms] = useState<Record<string, ItemReportForm>>(
    bundleOrder.items.reduce((acc, item) => ({
      ...acc,
      [item.id]: {
        userAmount: item.agentReport?.userAmount || 0,
        paymentLink: item.agentReport?.paymentLink || "",
        additionalDescription: item.agentReport?.additionalDescription || "",
        quantity: item.agentReport?.quantity,
      }
    }), {})
  );

  // Per-item images state
  const [itemImages, setItemImages] = useState<Record<string, { previews: string[], urls: string[] }>>(
    bundleOrder.items.reduce((acc, item) => ({
      ...acc,
      [item.id]: {
        previews: item.agentReport?.additionalImages || [],
        urls: item.agentReport?.additionalImages || [],
      }
    }), {})
  );
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  // Calculate total for per-item mode
  const perItemTotal = Object.values(itemForms).reduce((sum, item) => sum + (item.userAmount || 0), 0);

  const handleSingleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload: File[] = Array.from(files).slice(0, 3 - singleImagePreviews.length);
    if (filesToUpload.length === 0) {
      alert("Дээд тал нь 3 зураг оруулах боломжтой");
      return;
    }

    setUploadingImages(true);
    const newPreviews: string[] = [];
    const newUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newPreviews.push(base64);
        const result = await uploadImageToCloudinary(base64, apiClient);
        newUrls.push(result.url);
      }

      setSingleImagePreviews([...singleImagePreviews, ...newPreviews]);
      setSingleImageUrls([...singleImageUrls, ...newUrls]);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Зураг оруулахад алдаа гарлаа");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeSingleImage = (index: number) => {
    setSingleImagePreviews(singleImagePreviews.filter((_, i) => i !== index));
    setSingleImageUrls(singleImageUrls.filter((_, i) => i !== index));
  };

  // Per-item image handlers
  const handleItemImageChange = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = itemImages[itemId] || { previews: [], urls: [] };
    const filesToUpload: File[] = Array.from(files).slice(0, 3 - currentImages.previews.length);
    if (filesToUpload.length === 0) {
      alert("Дээд тал нь 3 зураг оруулах боломжтой");
      return;
    }

    setUploadingItemId(itemId);
    const newPreviews: string[] = [];
    const newUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newPreviews.push(base64);
        const result = await uploadImageToCloudinary(base64, apiClient);
        newUrls.push(result.url);
      }

      setItemImages({
        ...itemImages,
        [itemId]: {
          previews: [...currentImages.previews, ...newPreviews],
          urls: [...currentImages.urls, ...newUrls],
        }
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Зураг оруулахад алдаа гарлаа");
    } finally {
      setUploadingItemId(null);
      e.target.value = "";
    }
  };

  const removeItemImage = (itemId: string, index: number) => {
    const currentImages = itemImages[itemId];
    if (!currentImages) return;

    setItemImages({
      ...itemImages,
      [itemId]: {
        previews: currentImages.previews.filter((_, i) => i !== index),
        urls: currentImages.urls.filter((_, i) => i !== index),
      }
    });
  };

  const updateItemForm = (itemId: string, field: keyof ItemReportForm, value: string | number | undefined) => {
    setItemForms({
      ...itemForms,
      [itemId]: {
        ...itemForms[itemId],
        [field]: value,
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (reportMode === "single") {
        if (singleFormData.totalUserAmount <= 0) {
          setError("Нийт дүн 0-ээс их байх ёстой");
          setLoading(false);
          return;
        }

        const data: BundleReportData = {
          reportMode: "single",
          bundleReport: {
            totalUserAmount: singleFormData.totalUserAmount,
            paymentLink: singleFormData.paymentLink || undefined,
            additionalImages: singleImageUrls.length > 0 ? singleImageUrls : undefined,
            additionalDescription: singleFormData.additionalDescription || undefined,
          },
        };

        await apiClient.createBundleReport(bundleOrder.id, data);
      } else {
        // Per-item mode
        const itemReports = bundleOrder.items.map(item => {
          const form = itemForms[item.id];
          const images = itemImages[item.id];
          if (!form || form.userAmount <= 0) {
            throw new Error(`"${item.productName}" барааны дүнг оруулна уу`);
          }
          return {
            itemId: item.id,
            userAmount: form.userAmount,
            paymentLink: form.paymentLink || undefined,
            additionalDescription: form.additionalDescription || undefined,
            additionalImages: images?.urls?.length > 0 ? images.urls : undefined,
            quantity: form.quantity,
          };
        });

        const data: BundleReportData = {
          reportMode: "per_item",
          itemReports,
        };

        await apiClient.createBundleReport(bundleOrder.id, data);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Тайлан илгээхэд алдаа гарлаа";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Bundle Info */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Багц захиалгын мэдээлэл</h4>
        <p className="text-sm text-gray-600">Нийт {bundleOrder.items.length} бараа</p>
        <div className="mt-2 space-y-1">
          {bundleOrder.items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">{idx + 1}.</span>
              <span className="text-gray-700">{item.productName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Mode Toggle */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900">Барааг тусад нь үнэлэх</span>
            <p className="text-sm text-gray-500">
              {reportMode === "single"
                ? "Одоо: Багц бүхэлд нэг нийт дүн"
                : "Одоо: Бараа бүрт тусдаа дүн"}
            </p>
          </div>
          <div
            className={`relative w-14 h-8 rounded-full transition-colors ${
              reportMode === "per_item" ? "bg-blue-500" : "bg-gray-300"
            }`}
            onClick={() => setReportMode(reportMode === "single" ? "per_item" : "single")}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                reportMode === "per_item" ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </div>
        </label>
      </div>

      {reportMode === "single" ? (
        /* Single Mode Form */
        <div className="space-y-4">
          <div>
            <label htmlFor="totalUserAmount" className="block text-sm font-medium text-gray-900 mb-1">
              Нийт юань дүн <span className="text-red-500">*</span>
            </label>
            <input
              id="totalUserAmount"
              type="number"
              step="1"
              min="0"
              required
              value={singleFormData.totalUserAmount || ""}
              onChange={(e) => setSingleFormData({ ...singleFormData, totalUserAmount: Math.round(parseFloat(e.target.value)) || 0 })}
              className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Нийт юань дүн оруулна уу"
            />
          </div>

          <div>
            <label htmlFor="paymentLink" className="block text-sm font-medium text-gray-900 mb-1">
              Төлбөрийн холбоос / мэдээлэл
            </label>
            <input
              id="paymentLink"
              type="text"
              value={singleFormData.paymentLink || ""}
              onChange={(e) => setSingleFormData({ ...singleFormData, paymentLink: e.target.value })}
              className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Холбоос эсвэл текст оруулах"
            />
          </div>

          <div>
            <label htmlFor="additionalDescription" className="block text-sm font-medium text-gray-900 mb-1">
              Нэмэлт тайлбар
            </label>
            <textarea
              id="additionalDescription"
              rows={3}
              value={singleFormData.additionalDescription || ""}
              onChange={(e) => setSingleFormData({ ...singleFormData, additionalDescription: e.target.value })}
              className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Нэмэлт тайлбар бичнэ үү..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Нэмэлт зураг (Дээд тал нь 3)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSingleImageChange}
              disabled={uploadingImages || singleImagePreviews.length >= 3}
              className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            {uploadingImages && (
              <p className="text-sm text-gray-500 mt-1">Зураг ачааллаж байна...</p>
            )}
            {singleImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {singleImagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeSingleImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Per-Item Mode Form */
        <div className="space-y-4">
          {bundleOrder.items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                {item.imageUrls && item.imageUrls[0] ? (
                  <img src={item.imageUrls[0]} alt={item.productName} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h5 className="font-medium text-gray-900">{item.productName}</h5>
                  <p className="text-xs text-gray-500">Бараа #{idx + 1}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Юань дүн <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={itemForms[item.id]?.userAmount || ""}
                      onChange={(e) => updateItemForm(item.id, "userAmount", Math.round(parseFloat(e.target.value)) || 0)}
                      className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Тоо ширхэг
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemForms[item.id]?.quantity || ""}
                      onChange={(e) => updateItemForm(item.id, "quantity", parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Төлбөрийн холбоос / мэдээлэл
                  </label>
                  <input
                    type="text"
                    value={itemForms[item.id]?.paymentLink || ""}
                    onChange={(e) => updateItemForm(item.id, "paymentLink", e.target.value)}
                    className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Холбоос эсвэл текст оруулах"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Нэмэлт тайлбар
                  </label>
                  <textarea
                    rows={2}
                    value={itemForms[item.id]?.additionalDescription || ""}
                    onChange={(e) => updateItemForm(item.id, "additionalDescription", e.target.value)}
                    className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Нэмэлт тайлбар бичнэ үү..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Нэмэлт зураг (Дээд тал нь 3)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleItemImageChange(item.id, e)}
                    disabled={uploadingItemId === item.id || (itemImages[item.id]?.previews?.length || 0) >= 3}
                    className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  {uploadingItemId === item.id && (
                    <p className="text-xs text-gray-500 mt-1">Зураг ачааллаж байна...</p>
                  )}
                  {itemImages[item.id]?.previews?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {itemImages[item.id].previews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-16 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeItemImage(item.id, index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Total for per-item mode */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Нийт дүн:</span>
              <span className="text-xl font-bold text-green-600">{perItemTotal.toLocaleString()} ¥</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-11"
          >
            Цуцлах
          </button>
        )}
        <button
          type="submit"
          disabled={loading || uploadingImages || uploadingItemId !== null}
          className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
        >
          {loading ? "Илгээж байна..." : "Тайлан илгээх"}
        </button>
      </div>
    </form>
  );
}
