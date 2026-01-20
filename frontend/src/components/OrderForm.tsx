/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { apiClient, type Order, type OrderData } from "@/lib/api";

interface OrderFormProps {
  onSuccess?: (order: Order) => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderData>({
    productName: "",
    description: "",
    imageUrl: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // For now, we'll use base64 image data URL
      // In production, you'd upload to a cloud storage service first
      const orderData: OrderData = {
        productName: formData.productName,
        description: formData.description,
        imageUrl: imagePreview || undefined,
      };

      const order = await apiClient.createOrder(orderData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        productName: "",
        description: "",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(order);
        }, 1000);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
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
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          Захиалга амжилттай үүслээ!
        </div>
      )}

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-900 mb-1">
          Зураг
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {imagePreview && (
          <div className="mt-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-xs h-48 object-cover rounded-xl border border-gray-200"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-900 mb-1">
          Барааны нэр
        </label>
        <input
          id="productName"
          type="text"
          required
          value={formData.productName}
          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Жишээ: iPhone 15 Pro"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
          Тайлбар
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Барааны дэлгэрэнгүй мэдээлэл оруулах..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium text-base min-h-11"
      >
        {loading ? "Хадгалж байна..." : "Захиалга үүсгэх"}
      </button>
    </form>
  );
}

