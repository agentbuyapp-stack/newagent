"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApiClient } from "@/lib/useApiClient";
import type { ProductShowcase, ShowcaseProduct } from "@/lib/api";

export default function ShowcaseManager() {
  const apiClient = useApiClient();
  const [showcases, setShowcases] = useState<ProductShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creatingShowcase, setCreatingShowcase] = useState(false);

  const fetchShowcases = useCallback(async () => {
    try {
      const response = await apiClient.getAllShowcases();
      if (response.success) {
        setShowcases(response.data);
      }
    } catch (error) {
      console.error("Error fetching showcases:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchShowcases();
  }, [fetchShowcases]);

  const handleCreateShowcase = async () => {
    if (!newTitle.trim()) return;
    setCreatingShowcase(true);
    try {
      const response = await apiClient.createShowcase({
        title: newTitle,
        products: [],
        isActive: true,
        order: 0,
      });
      if (response.success) {
        setNewTitle("");
        fetchShowcases();
      }
    } catch (error) {
      console.error("Error creating showcase:", error);
    } finally {
      setCreatingShowcase(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await apiClient.toggleShowcaseStatus(id);
      if (response.success) {
        fetchShowcases();
      }
    } catch (error) {
      console.error("Error toggling showcase status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ ангилалыг устгах уу?")) return;
    try {
      const response = await apiClient.deleteShowcase(id);
      if (response.success) {
        fetchShowcases();
      }
    } catch (error) {
      console.error("Error deleting showcase:", error);
    }
  };

  const handleUpdateShowcase = async (id: string, data: { products?: ShowcaseProduct[]; title?: string }): Promise<void> => {
    try {
      await apiClient.updateShowcase(id, data);
      await fetchShowcases();
    } catch (error) {
      console.error("Error updating showcase:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create new category */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Шинэ ангилал үүсгэх
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Гарчиг оруулна уу (жишээ: Эмэгтэйчүүдийн баяр)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreateShowcase()}
          />
          <button
            onClick={handleCreateShowcase}
            disabled={!newTitle.trim() || creatingShowcase}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {creatingShowcase ? "..." : "Үүсгэх"}
          </button>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-4">
        {showcases.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Ангилал байхгүй байна. Дээрх хэсэгт гарчиг бичээд үүсгэнэ үү.
          </div>
        ) : (
          showcases.map((showcase) => (
            <ShowcaseCard
              key={showcase.id}
              showcase={showcase}
              onToggleStatus={() => handleToggleStatus(showcase.id)}
              onDelete={() => handleDelete(showcase.id)}
              onUpdate={(data) => handleUpdateShowcase(showcase.id, data)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ShowcaseCardProps {
  showcase: ProductShowcase;
  onToggleStatus: () => void;
  onDelete: () => void;
  onUpdate: (data: { products?: ShowcaseProduct[]; title?: string }) => Promise<void>;
}

function ShowcaseCard({ showcase, onToggleStatus, onDelete, onUpdate }: ShowcaseCardProps) {
  const apiClient = useApiClient();
  const [products, setProducts] = useState<ShowcaseProduct[]>(showcase.products);
  const [title, setTitle] = useState(showcase.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync with parent
  useEffect(() => {
    setProducts(showcase.products);
    setTitle(showcase.title);
    setHasChanges(false);
  }, [showcase.products, showcase.title]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (newTitle !== showcase.title) {
      setHasChanges(true);
    }
  };

  const handleAddProduct = () => {
    const newProducts = [...products, { name: "", image: "", price: undefined, link: "", badge: "belen" as const }];
    setProducts(newProducts);
    setHasChanges(true);
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
    setHasChanges(true);
  };

  const handleProductChange = (index: number, field: keyof ShowcaseProduct, value: string | number | undefined) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validProducts = products.filter(p => p.name || p.image);
      const updateData: { products?: ShowcaseProduct[]; title?: string } = { products: validProducts };
      if (title !== showcase.title) {
        updateData.title = title;
      }
      await onUpdate(updateData);
      setHasChanges(false);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploading(index);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const response = await apiClient.uploadImage(base64);
        if (response.imageUrl) {
          setProducts(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], image: response.imageUrl };
            return updated;
          });
          setHasChanges(true);
        }
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => !hasChanges && setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setTitle(showcase.title);
                  setIsEditingTitle(false);
                  setHasChanges(JSON.stringify(products) !== JSON.stringify(showcase.products));
                }
              }}
              className="font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none px-1"
            />
          ) : (
            <h3
              className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Дарж засах"
            >
              {title}
            </h3>
          )}
          {!isEditingTitle && (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Гарчиг засах"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            showcase.isActive
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}>
            {showcase.isActive ? "Идэвхтэй" : "Идэвхгүй"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Save button */}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Хадгалах
            </button>
          )}
          {/* Toggle visibility */}
          <button
            onClick={onToggleStatus}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors relative group"
            title={showcase.isActive ? "Хэрэглэгчдэд нуух" : "Хэрэглэгчдэд харуулах"}
          >
            {showcase.isActive ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l8.243 8.243M3 3l3.878 3.878" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {showcase.isActive ? "Нуух" : "Харуулах"}
            </span>
          </button>
          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors relative group"
            title="Устгах"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Устгах
            </span>
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product, index) => (
          <div key={index} className="flex-shrink-0 w-32 relative group">
            {/* Image upload */}
            <div
              onClick={() => fileInputRefs.current[index]?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer overflow-hidden hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700"
            >
              {uploading === index ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : product.image ? (
                <img src={product.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
              <input
                ref={el => { fileInputRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(index, file);
                }}
              />
            </div>

            {/* Remove button */}
            <button
              onClick={() => handleRemoveProduct(index)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Badge selection */}
            <select
              value={product.badge || "belen"}
              onChange={(e) => handleProductChange(index, "badge", e.target.value as "belen" | "zahialgaar")}
              className="w-full mt-1 px-1 py-1 text-[10px] border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="belen">Бэлэн</option>
              <option value="zahialgaar">Захиалгаар</option>
            </select>

            {/* Name input */}
            <input
              type="text"
              value={product.name}
              onChange={(e) => handleProductChange(index, "name", e.target.value)}
              placeholder="Нэр"
              className="w-full mt-1 px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />

            {/* Price input */}
            <input
              type="number"
              value={product.price || ""}
              onChange={(e) => handleProductChange(index, "price", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Үнэ ₮"
              className="w-full mt-1 px-1.5 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        ))}

        {/* Add product button */}
        <button
          onClick={handleAddProduct}
          className="flex-shrink-0 w-32 aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-blue-500"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs mt-1">Нэмэх</span>
        </button>
      </div>
    </div>
  );
}
