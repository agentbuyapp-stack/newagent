"use client";

import { useState } from "react";
import { useApiClient } from "@/lib/useApiClient";

export default function CardManager() {
  const apiClient = useApiClient();

  // Gift cards state
  const [giftPhone, setGiftPhone] = useState("");
  const [giftAmount, setGiftAmount] = useState(5);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftMessage, setGiftMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Grant all state
  const [grantAmount, setGrantAmount] = useState(5);
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMessage, setGrantMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showGrantConfirm, setShowGrantConfirm] = useState(false);

  const handleGiftCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftPhone || giftAmount < 1) return;

    setGiftLoading(true);
    setGiftMessage(null);

    try {
      const response = await apiClient.adminGiftCards(giftPhone, giftAmount);
      setGiftMessage({ type: "success", text: response.message });
      setGiftPhone("");
      setGiftAmount(5);
    } catch (error: any) {
      setGiftMessage({ type: "error", text: error.message || "Карт илгээхэд алдаа гарлаа" });
    } finally {
      setGiftLoading(false);
    }
  };

  const handleGrantToAll = async () => {
    if (!showGrantConfirm) {
      setShowGrantConfirm(true);
      return;
    }

    setGrantLoading(true);
    setGrantMessage(null);

    try {
      const response = await apiClient.grantCardsToAllUsers(grantAmount);
      setGrantMessage({ type: "success", text: response.message });
      setShowGrantConfirm(false);
    } catch (error: any) {
      setGrantMessage({ type: "error", text: error.message || "Карт олгоход алдаа гарлаа" });
      setShowGrantConfirm(false);
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gift cards to specific user */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
          Карт бэлэглэх
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Хэрэглэгч эсвэл агентэд утасны дугаараар нь карт бэлэглэх
        </p>

        {giftMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              giftMessage.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {giftMessage.text}
          </div>
        )}

        <form onSubmit={handleGiftCards} className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            value={giftPhone}
            onChange={(e) => setGiftPhone(e.target.value)}
            placeholder="Утасны дугаар (99112233)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
            disabled={giftLoading}
          />
          <input
            type="number"
            min="1"
            value={giftAmount}
            onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
            disabled={giftLoading}
          />
          <button
            type="submit"
            disabled={giftLoading || !giftPhone}
            className="px-6 py-2.5 text-sm sm:text-base text-white bg-amber-500 rounded-xl hover:bg-amber-600 active:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {giftLoading ? "Илгээж байна..." : "Бэлэглэх"}
          </button>
        </form>
      </div>

      {/* Grant cards to all users */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Бүх хэрэглэгчдэд карт олгох
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Бүх хэрэглэгчдэд тодорхой тооны карт нэмж олгох (урамшуулал)
        </p>

        {grantMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              grantMessage.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {grantMessage.text}
          </div>
        )}

        {showGrantConfirm && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800">
            <strong>Анхааруулга:</strong> Бүх хэрэглэгчдэд {grantAmount} карт нэмж олгохдоо итгэлтэй байна уу?
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Картын тоо:</label>
            <input
              type="number"
              min="1"
              value={grantAmount}
              onChange={(e) => setGrantAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              disabled={grantLoading}
            />
          </div>
          <div className="flex gap-2">
            {showGrantConfirm && (
              <button
                onClick={() => setShowGrantConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={grantLoading}
              >
                Цуцлах
              </button>
            )}
            <button
              onClick={handleGrantToAll}
              disabled={grantLoading}
              className={`px-6 py-2 text-sm text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                showGrantConfirm
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {grantLoading
                ? "Олгож байна..."
                : showGrantConfirm
                  ? "Тийм, олгох"
                  : "Бүгдэд олгох"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
