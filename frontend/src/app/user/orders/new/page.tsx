"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApiClient } from "@/lib/useApiClient";
import { type OrderData } from "@/lib/api";

export default function NewOrderPage() {
  const router = useRouter();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Products order state - start with one product (Дан бараа)
  // Use unique IDs to prevent React from losing state when adding products
  const [orders, setOrders] = useState<Array<OrderData & { id: number }>>([
    { id: Date.now(), productName: "", description: "", imageUrls: [] },
  ]);
  const [imagePreviews, setImagePreviews] = useState<string[][]>([[]]); // Array of arrays - each product can have up to 3 images

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, productIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newPreviews = [...imagePreviews];
    const currentImages = newPreviews[productIndex] || [];
    
    // Limit to 3 images total per product
    const remainingSlots = 3 - currentImages.length;
    if (remainingSlots <= 0) {
      alert("Дээд тал нь 3 зураг оруулах боломжтой");
      return;
    }
    
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const updatedPreviews = [...imagePreviews];
        if (!updatedPreviews[productIndex]) {
          updatedPreviews[productIndex] = [];
        }
        updatedPreviews[productIndex] = [...updatedPreviews[productIndex], dataUrl];
        setImagePreviews(updatedPreviews);
        
        // Update orders with imageUrls
        const newOrders = [...orders];
        if (!newOrders[productIndex].imageUrls) {
          newOrders[productIndex].imageUrls = [];
        }
        newOrders[productIndex].imageUrls = [...updatedPreviews[productIndex]];
        setOrders(newOrders);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = "";
  };

  const removeImage = (productIndex: number, imageIndex: number) => {
    const newPreviews = [...imagePreviews];
    newPreviews[productIndex] = newPreviews[productIndex].filter((_, i) => i !== imageIndex);
    setImagePreviews(newPreviews);
    
    const newOrders = [...orders];
    if (newOrders[productIndex].imageUrls) {
      newOrders[productIndex].imageUrls = newPreviews[productIndex];
    }
    setOrders(newOrders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate that at least one order has required fields
      const validOrders = orders.filter(order => order.productName && order.description);
      if (validOrders.length === 0) {
        setError("Хамгийн багадаа нэг барааны нэр болон тайлбар оруулах шаардлагатай");
        setLoading(false);
        return;
      }

      // Create all orders (remove id before sending)
      const createdOrders: string[] = [];
      for (const order of validOrders) {
        try {
          const { id, ...orderData } = order;
          // Ensure imageUrls is an array (can be empty)
          if (!orderData.imageUrls) {
            orderData.imageUrls = [];
          }
          await apiClient.createOrder(orderData);
          createdOrders.push(order.productName);
        } catch (orderErr: any) {
          // Continue creating other orders even if one fails
          setError(`Захиалга үүсгэхэд алдаа гарлаа: ${order.productName} - ${orderErr.message || "Алдаа"}`);
        }
      }

      if (createdOrders.length > 0) {
        // Success - redirect to dashboard
        router.push("/user/dashboard");
      } else {
        setError("Бүх захиалга үүсгэхэд алдаа гарлаа");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Алдаа гарлаа");
      setLoading(false);
    }
  };

  const addProductField = () => {
    setOrders([...orders, { id: Date.now() + Math.random(), productName: "", description: "", imageUrls: [] }]);
    setImagePreviews([...imagePreviews, []]);
  };

  const removeProductField = (id: number) => {
    if (orders.length > 1) {
      const index = orders.findIndex(o => o.id === id);
      setOrders(orders.filter((_, i) => i !== index));
      setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/user/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Буцах
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Захиалга үүсгэх</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-2 sm:px-6 lg:px-8">
        <div className="px-4 py-1 sm:px-0">
          <div className="bg-white shadow-lg rounded-lg p-6">
          

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {orders.map((order, index) => (
                <div key={order.id} className="border-2 border-gray-200 rounded-lg p-5 space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {index === 0 ? " Бараа #1" : `Бараа #${index + 1}`}
                    </h3>
                    {orders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductField(order.id)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Устгах
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Зураг (Дээд тал нь 3 зураг)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageChange(e, index)}
                      disabled={imagePreviews[index]?.length >= 3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {imagePreviews[index] && imagePreviews[index].length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {imagePreviews[index].map((preview, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}-${imgIndex + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, imgIndex)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                              title="Устгах"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {imagePreviews[index]?.length >= 3 && (
                      <p className="mt-2 text-sm text-gray-500">Дээд тал нь 3 зураг оруулах боломжтой</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Барааны нэр
                    </label>
                    <input
                      type="text"
                      required
                      value={order.productName}
                      onChange={(e) => {
                        const newOrders = [...orders];
                        newOrders[index].productName = e.target.value;
                        setOrders(newOrders);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Барааны нэр оруулах"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тайлбар
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={order.description}
                      onChange={(e) => {
                        const newOrders = [...orders];
                        newOrders[index].description = e.target.value;
                        setOrders(newOrders);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Барааны дэлгэрэнгүй тайлбар оруулах..."
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addProductField}
                className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Бараа нэмэх
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold text-lg"
              >
                {loading ? "Хадгалж байна..." : "Захиалга үүсгэх"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
