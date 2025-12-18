"use client";

import { useState } from "react";
import { type Order, type AgentReportData } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
// Upload image via backend API
async function uploadImageToCloudinary(base64Data: string, apiClient: any): Promise<{ url: string }> {
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

interface AgentReportFormProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AgentReportForm({ order, onSuccess, onCancel }: AgentReportFormProps) {
  const apiClient = useApiClient();
  const [formData, setFormData] = useState<AgentReportData>({
    userAmount: 0,
    paymentLink: "",
    additionalImages: [],
    additionalDescription: "",
    quantity: undefined,
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: string[] = [];
    const filesToUpload: File[] = Array.from(files).slice(0, 3 - imagePreviews.length);

    if (filesToUpload.length === 0) {
      alert("Дээд тал нь 3 зураг оруулах боломжтой");
      return;
    }

    setUploadingImages(true);
    try {
      for (const file of filesToUpload) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          newPreviews.push(base64);
          
          if (newPreviews.length === filesToUpload.length) {
            // Upload all images to Cloudinary
            const uploadedUrls: string[] = [];
            for (const preview of newPreviews) {
              try {
                const result = await uploadImageToCloudinary(preview, apiClient);
                uploadedUrls.push(result.url);
              } catch (err) {
                console.error("Error uploading image:", err);
              }
            }
            
            setImagePreviews([...imagePreviews, ...newPreviews]);
            setFormData({
              ...formData,
              additionalImages: [...(formData.additionalImages || []), ...uploadedUrls],
            });
            setUploadingImages(false);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error("Error processing images:", err);
      setUploadingImages(false);
    }
    
    // Reset input
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = formData.additionalImages?.filter((_, i) => i !== index) || [];
    setImagePreviews(newPreviews);
    setFormData({
      ...formData,
      additionalImages: newImages,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (formData.userAmount <= 0) {
        setError("User дүн 0-ээс их байх ёстой");
        setLoading(false);
        return;
      }

      await apiClient.createAgentReport(order.id, formData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Тайлан илгээхэд алдаа гарлаа");
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

      <div>
        <label htmlFor="userAmount" className="block text-sm font-medium text-gray-900 mb-1">
          User дүн <span className="text-red-500">*</span>
        </label>
        <input
          id="userAmount"
          type="number"
          step="0.01"
          min="0"
          required
          value={formData.userAmount || ""}
          onChange={(e) => setFormData({ ...formData, userAmount: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="0.00"
        />
      </div>

      <div>
        <label htmlFor="paymentLink" className="block text-sm font-medium text-gray-900 mb-1">
          Төлбөрийн холбоос
        </label>
        <input
          id="paymentLink"
          type="url"
          value={formData.paymentLink || ""}
          onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="https://..."
        />
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-900 mb-1">
          Тоо ширхэг
        </label>
        <input
          id="quantity"
          type="number"
          min="1"
          value={formData.quantity || ""}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || undefined })}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="1"
        />
      </div>

      <div>
        <label htmlFor="additionalDescription" className="block text-sm font-medium text-gray-900 mb-1">
          Нэмэлт тайлбар
        </label>
        <textarea
          id="additionalDescription"
          rows={4}
          value={formData.additionalDescription || ""}
          onChange={(e) => setFormData({ ...formData, additionalDescription: e.target.value })}
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
          onChange={handleImageChange}
          disabled={uploadingImages || imagePreviews.length >= 3}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
        />
        {uploadingImages && (
          <p className="text-sm text-gray-500 mt-1">Зураг ачааллаж байна...</p>
        )}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 active:bg-red-700 transition-colors min-h-[32px] min-w-[32px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-[44px]"
          >
            Цуцлах
          </button>
        )}
        <button
          type="submit"
          disabled={loading || uploadingImages}
          className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {loading ? "Илгээж байна..." : "Тайлан илгээх"}
        </button>
      </div>
    </form>
  );
}

