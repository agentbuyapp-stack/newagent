/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { Cargo } from "@/lib/api";
import type { CargoFormData } from "@/hooks/useAdminActions";

interface CargosTabProps {
  cargos: Cargo[];
  uploadingCargoImage: boolean;
  onCreateCargo: (formData: CargoFormData, onSuccess: () => void) => Promise<void>;
  onUpdateCargo: (cargoId: string, formData: CargoFormData, onSuccess: () => void) => Promise<void>;
  onDeleteCargo: (cargoId: string) => Promise<void>;
  onCargoImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    setFormData: React.Dispatch<React.SetStateAction<CargoFormData>>
  ) => Promise<void>;
}

const initialFormData: CargoFormData = {
  name: "",
  description: "",
  phone: "",
  location: "",
  website: "",
  facebook: "",
  imageUrl: "",
};

export function CargosTab({
  cargos,
  uploadingCargoImage,
  onCreateCargo,
  onUpdateCargo,
  onDeleteCargo,
  onCargoImageUpload,
}: CargosTabProps) {
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [cargoFormData, setCargoFormData] = useState<CargoFormData>(initialFormData);

  const handleToggleForm = () => {
    setEditingCargo(null);
    setCargoFormData(initialFormData);
    setShowCargoForm(!showCargoForm);
  };

  const handleEditCargo = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setCargoFormData({
      name: cargo.name,
      description: cargo.description || "",
      phone: cargo.phone || "",
      location: cargo.location || "",
      website: cargo.website || "",
      facebook: cargo.facebook || "",
      imageUrl: cargo.imageUrl || "",
    });
    setShowCargoForm(true);
  };

  const handleSubmit = async () => {
    const onSuccess = () => {
      setEditingCargo(null);
      setCargoFormData(initialFormData);
      setShowCargoForm(false);
    };

    if (editingCargo) {
      await onUpdateCargo(editingCargo.id, cargoFormData, onSuccess);
    } else {
      await onCreateCargo(cargoFormData, onSuccess);
    }
  };

  const handleCancelEdit = () => {
    setEditingCargo(null);
    setCargoFormData(initialFormData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Cargos
        </h3>
        <button
          onClick={handleToggleForm}
          className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
        >
          {showCargoForm ? "Хаах" : "Cargo нэмэх"}
        </button>
      </div>

      {showCargoForm && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Cargo нэр
              </label>
              <input
                type="text"
                value={cargoFormData.name}
                onChange={(e) =>
                  setCargoFormData({ ...cargoFormData, name: e.target.value })
                }
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Cargo нэр оруулах"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Тайлбар
              </label>
              <textarea
                value={cargoFormData.description}
                onChange={(e) =>
                  setCargoFormData({
                    ...cargoFormData,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Тайлбар оруулах (жишээ: cargo & 24/7 smart locker)"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Утас
                </label>
                <input
                  type="text"
                  value={cargoFormData.phone}
                  onChange={(e) =>
                    setCargoFormData({ ...cargoFormData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="99739959"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Байршил (Google Maps)
                </label>
                <input
                  type="text"
                  value={cargoFormData.location}
                  onChange={(e) =>
                    setCargoFormData({
                      ...cargoFormData,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Вэбсайт
                </label>
                <input
                  type="text"
                  value={cargoFormData.website}
                  onChange={(e) =>
                    setCargoFormData({
                      ...cargoFormData,
                      website: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="www.example.mn"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Facebook хуудас
              </label>
              <input
                type="text"
                value={cargoFormData.facebook}
                onChange={(e) =>
                  setCargoFormData({
                    ...cargoFormData,
                    facebook: e.target.value,
                  })
                }
                className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Зураг
              </label>
              <div className="flex items-center gap-3">
                {cargoFormData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={cargoFormData.imageUrl}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCargoFormData((prev) => ({ ...prev, imageUrl: "" }))
                      }
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    {uploadingCargoImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">Зураг</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onCargoImageUpload(e, setCargoFormData)}
                      className="hidden"
                      disabled={uploadingCargoImage}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 text-sm text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium min-h-11"
              >
                {editingCargo ? "Шинэчлэх" : "Үүсгэх"}
              </button>
              {editingCargo && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-11"
                >
                  Цуцлах
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {cargos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cargos.map((cargo) => (
            <div
              key={cargo.id}
              className="border border-gray-200 rounded-xl p-4 bg-white"
            >
              <div className="flex items-start gap-3">
                {cargo.imageUrl && (
                  <img
                    src={cargo.imageUrl}
                    alt={cargo.name}
                    className="w-12 h-12 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{cargo.name}</h4>
                </div>
              </div>
              {cargo.description && (
                <p className="text-sm text-gray-600 mt-1">{cargo.description}</p>
              )}
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                {cargo.phone && (
                  <p className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {cargo.phone}
                  </p>
                )}
                {cargo.website && (
                  <p className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    {cargo.website}
                  </p>
                )}
                {cargo.location && (
                  <p className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="truncate">Байршил</span>
                  </p>
                )}
                {cargo.facebook && (
                  <p className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="truncate">Facebook</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEditCargo(cargo)}
                  className="px-3 py-1.5 text-xs text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-8"
                >
                  Засах
                </button>
                <button
                  onClick={() => onDeleteCargo(cargo.id)}
                  className="px-3 py-1.5 text-xs text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-8"
                >
                  Устгах
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
          Cargo байхгүй байна.
        </div>
      )}
    </div>
  );
}
