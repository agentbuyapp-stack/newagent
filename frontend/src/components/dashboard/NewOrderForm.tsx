"use client";

import React, { useState } from "react";
import { OrderData } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface NewOrderFormProps {
  onSuccess: () => void;
}

export default function NewOrderForm({ onSuccess }: NewOrderFormProps) {
  const apiClient = useApiClient();

  // New order form state - support multiple products
  const [newOrders, setNewOrders] = useState<Array<OrderData & { id: number }>>([
    { id: Date.now(), productName: "", description: "", imageUrls: [] },
  ]);
  const [newOrderImagePreviews, setNewOrderImagePreviews] = useState<string[][]>([
    [],
  ]);
  const [newOrderLoading, setNewOrderLoading] = useState(false);
  const [newOrderError, setNewOrderError] = useState("");
  const [newOrderSuccess, setNewOrderSuccess] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(
    new Set([Date.now()])
  ); // Track which products are expanded

  const handleNewOrderImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    productIndex: number
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews = [...newOrderImagePreviews];
    const currentImages = newPreviews[productIndex] || [];

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
        const updatedPreviews = [...newOrderImagePreviews];
        if (!updatedPreviews[productIndex]) {
          updatedPreviews[productIndex] = [];
        }
        updatedPreviews[productIndex] = [
          ...updatedPreviews[productIndex],
          dataUrl,
        ];
        setNewOrderImagePreviews(updatedPreviews);

        const newOrdersList = [...newOrders];
        if (!newOrdersList[productIndex].imageUrls) {
          newOrdersList[productIndex].imageUrls = [];
        }
        newOrdersList[productIndex].imageUrls = updatedPreviews[productIndex];
        setNewOrders(newOrdersList);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeNewOrderImage = (productIndex: number, imageIndex: number) => {
    const updatedPreviews = [...newOrderImagePreviews];
    updatedPreviews[productIndex] = updatedPreviews[productIndex].filter(
      (_, i) => i !== imageIndex
    );
    setNewOrderImagePreviews(updatedPreviews);

    const newOrdersList = [...newOrders];
    newOrdersList[productIndex].imageUrls = updatedPreviews[productIndex];
    setNewOrders(newOrdersList);
  };

  const addNewProductField = () => {
    const newId = Date.now() + Math.random();
    setNewOrders([
      ...newOrders,
      { id: newId, productName: "", description: "", imageUrls: [] },
    ]);
    setNewOrderImagePreviews([...newOrderImagePreviews, []]);
    // Collapse first product when adding new one
    if (newOrders.length > 0) {
      const firstProductId = newOrders[0].id; // unused variable
      setExpandedProducts(new Set([newId])); // Only expand the new product
    } else {
      setExpandedProducts(new Set([newId]));
    }
  };

  const toggleProductExpand = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const removeNewProductField = (id: number) => {
    if (newOrders.length > 1) {
      const index = newOrders.findIndex((o) => o.id === id);
      setNewOrders(newOrders.filter((_, i) => i !== index));
      setNewOrderImagePreviews(
        newOrderImagePreviews.filter((_, i) => i !== index)
      );
      // Remove from expanded set
      const newExpanded = new Set(expandedProducts);
      newExpanded.delete(id);
      setExpandedProducts(newExpanded);
    }
  };

  const handleNewOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewOrderLoading(true);
    setNewOrderError("");
    setNewOrderSuccess(false);

    try {
      // Validate that at least one order has required fields
      const validOrders = newOrders.filter(
        (order) => order.productName && order.description
      );
      if (validOrders.length === 0) {
        setNewOrderError(
          "Хамгийн багадаа нэг барааны нэр болон тайлбар оруулах шаардлагатай"
        );
        setNewOrderLoading(false);
        return;
      }

      // Create one order with multiple products
      const createdOrders: string[] = [];
      const errors: string[] = [];

      try {
        // If multiple products, create one order with all products
        if (validOrders.length > 1) {
          const products = validOrders
            .filter((order) => order.productName && order.description)
            .map((order) => ({
              productName: order.productName!,
              description: order.description!,
              imageUrls: order.imageUrls || [],
            }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await apiClient.createOrder({ products } as any);
          createdOrders.push(
            ...validOrders
              .filter((o) => o.productName)
              .map((o) => o.productName!)
          );
        } else {
          // Single product order
          const { id, ...orderData } = validOrders[0]; // eslint-disable-line @typescript-eslint/no-unused-vars
          // Ensure imageUrls is an array (can be empty)
          if (!orderData.imageUrls) {
            orderData.imageUrls = [];
          }

          await apiClient.createOrder(orderData);
          if (validOrders[0].productName) {
            createdOrders.push(validOrders[0].productName);
          }
        }
      } catch (orderErr: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(`[DEBUG] Error creating order:`, {
          message: orderErr.message,
          stack: orderErr.stack,
          response: orderErr.response,
        });
        errors.push(`Захиалга үүсгэхэд алдаа: ${orderErr.message || "Алдаа"}`);
      }

      if (createdOrders.length > 0) {
        setNewOrderSuccess(true);
        setNewOrders([
          { id: Date.now(), productName: "", description: "", imageUrls: [] },
        ]);
        setNewOrderImagePreviews([[]]);

        onSuccess();

        // Show error message if some orders failed
        if (errors.length > 0) {
          setNewOrderError(
            `Зарим захиалга үүсгэхэд алдаа гарлаа: ${errors.join(", ")}`
          );
        }

        // Reset success message after 2 seconds
        setTimeout(() => {
          setNewOrderSuccess(false);
        }, 2000);
      } else {
        setNewOrderError(
          `Бүх захиалга үүсгэхэд алдаа гарлаа: ${errors.join(", ")}`
        );
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setNewOrderError(err.message || "Алдаа гарлаа");
    } finally {
      setNewOrderLoading(false);
    }
  };

  return (
    <form onSubmit={handleNewOrderSubmit} className="space-y-4 sm:space-y-6">
      {newOrderError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {newOrderError}
        </div>
      )}

      {newOrderSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          Захиалга амжилттай үүслээ!
        </div>
      )}

      {newOrders.map((order, index) => {
        const isExpanded = expandedProducts.has(order.id);
        return (
          <div
            key={order.id}
            className="border border-gray-200 rounded-xl bg-gray-50"
          >
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleProductExpand(order.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {index === 0 ? "Бараа #1" : `Бараа #${index + 1}`}
                  {order.productName && ` - ${order.productName}`}
                </h3>
              </div>
              {newOrders.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNewProductField(order.id);
                  }}
                  className="px-2 py-1 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors flex items-center gap-1 shrink-0 min-h-8"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Устгах
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Зураг (Дээд тал нь 3 зураг)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleNewOrderImageChange(e, index)}
                    disabled={newOrderImagePreviews[index]?.length >= 3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  {newOrderImagePreviews[index] &&
                    newOrderImagePreviews[index].length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {newOrderImagePreviews[index].map(
                          (preview, imgIndex) => (
                            <div key={imgIndex} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}-${imgIndex + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeNewOrderImage(index, imgIndex)
                                }
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                title="Устгах"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  {newOrderImagePreviews[index]?.length >= 3 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Дээд тал нь 3 зураг оруулах боломжтой
                    </p>
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
                      const updatedOrders = [...newOrders];
                      updatedOrders[index].productName = e.target.value;
                      setNewOrders(updatedOrders);
                    }}
                    className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Барааны нэр оруулах"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тайлбар
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={order.description}
                    onChange={(e) => {
                      const updatedOrders = [...newOrders];
                      updatedOrders[index].description = e.target.value;
                      setNewOrders(updatedOrders);
                    }}
                    className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Барааны дэлгэрэнгүй тайлбар оруулах..."
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addNewProductField}
        className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium text-base min-h-11"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Бараа нэмэх
      </button>

      <button
        type="submit"
        disabled={newOrderLoading}
        className="w-full px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 disabled:opacity-50 transition-colors font-medium text-base min-h-[11]"
      >
        {newOrderLoading ? "Хадгалж байна..." : "Захиалга үүсгэх"}
      </button>
    </form>
  );
}
