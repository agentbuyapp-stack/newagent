"use client";

import { useState } from "react";
import type { AdminSettings, AdminSettingsData } from "@/lib/api";

interface SettingsTabProps {
  adminSettings: AdminSettings | null;
  settingsFormData: AdminSettingsData;
  onSettingsFormChange: (data: AdminSettingsData) => void;
  savingSettings: boolean;
  settingsSaved: boolean;
  onSaveSettings: (formData: AdminSettingsData, onSuccess: () => void) => Promise<void>;
  onRecalculateStats: () => Promise<void>;
}

export function SettingsTab({
  adminSettings,
  settingsFormData,
  onSettingsFormChange,
  savingSettings,
  settingsSaved,
  onSaveSettings,
  onRecalculateStats,
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
      orderLimitEnabled: adminSettings?.orderLimitEnabled ?? true,
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

              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Хязгаарлалт идэвхжүүлэх
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onSettingsFormChange({
                      ...settingsFormData,
                      orderLimitEnabled: !settingsFormData.orderLimitEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settingsFormData.orderLimitEnabled
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settingsFormData.orderLimitEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {settingsFormData.orderLimitEnabled && (
                <>
                  <div className="mb-3">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Идэвхтэй захиалгын хязгаар
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settingsFormData.maxActiveOrders || 10}
                      onChange={(e) =>
                        onSettingsFormChange({
                          ...settingsFormData,
                          maxActiveOrders: parseInt(e.target.value) || 10,
                        })
                      }
                      className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Нэг хэрэглэгч дуусаагүй хэдэн захиалгатай байж болох
                    </p>
                  </div>
                </>
              )}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Төлөв:</span>
                  <span
                    className={`text-sm font-medium ${adminSettings?.orderLimitEnabled !== false ? "text-green-600" : "text-gray-500"}`}
                  >
                    {adminSettings?.orderLimitEnabled !== false
                      ? "Идэвхтэй"
                      : "Идэвхгүй"}
                  </span>
                </div>
                {adminSettings?.orderLimitEnabled !== false && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Өдөрт максимум:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {adminSettings?.maxOrdersPerDay ?? 10} захиалга
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Идэвхтэй хязгаар:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {adminSettings?.maxActiveOrders ?? 10} захиалга
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agent Stats Section */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white mt-4">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          Агентуудын статистик
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Агентуудын гүйлгээний тоо болон амжилтын хувийг захиалгын түүхээс дахин
          тооцоолох
        </p>
        <button
          onClick={onRecalculateStats}
          className="px-4 py-2.5 text-sm text-white bg-purple-500 rounded-xl hover:bg-purple-600 active:bg-purple-700 transition-colors font-medium min-h-10"
        >
          Статистик дахин тооцоолох
        </button>
      </div>
    </div>
  );
}
