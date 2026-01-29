"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@/lib/useApiClient";
import { CardTransaction } from "@/lib/api";

interface CardActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userRole: string;
}

type TabType = "gift" | "history";

const transactionTypeLabels: Record<string, string> = {
  initial_grant: "Урамшуулал",
  admin_gift: "Админаас",
  agent_gift: "Агентаас",
  user_transfer: "Шилжүүлэг",
  order_deduction: "Захиалга",
};

const transactionTypeColors: Record<string, string> = {
  initial_grant: "text-green-600 dark:text-green-400",
  admin_gift: "text-purple-600 dark:text-purple-400",
  agent_gift: "text-blue-600 dark:text-blue-400",
  user_transfer: "text-amber-600 dark:text-amber-400",
  order_deduction: "text-red-600 dark:text-red-400",
};

export default function CardActionsModal({
  isOpen,
  onClose,
  balance,
  userRole,
}: CardActionsModalProps) {
  const apiClient = useApiClient();
  const [activeTab, setActiveTab] = useState<TabType>("gift");

  // Gift form state
  const [giftAmount, setGiftAmount] = useState(1);
  const [giftPhone, setGiftPhone] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [giftSuccess, setGiftSuccess] = useState("");
  const [showGiftConfirm, setShowGiftConfirm] = useState(false);

  // History state
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Fetch history when tab changes to history
  useEffect(() => {
    if (isOpen && activeTab === "history") {
      fetchHistory();
    }
  }, [isOpen, activeTab]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGiftAmount(1);
      setGiftPhone("");
      setGiftError("");
      setGiftSuccess("");
      setShowGiftConfirm(false);
      setTransactions([]);
      setHistoryPage(1);
      setHasMoreHistory(true);
    }
  }, [isOpen]);

  const fetchHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const response = await apiClient.getCardHistory(page, 10);
      const data = response.data;
      if (page === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions((prev) => [...prev, ...data.transactions]);
      }
      setHistoryPage(page);
      setHasMoreHistory(page < data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch card history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGiftSubmit = async () => {
    if (!showGiftConfirm) {
      setShowGiftConfirm(true);
      return;
    }

    setGiftLoading(true);
    setGiftError("");
    setGiftSuccess("");

    try {
      const response = await apiClient.giftCards(giftPhone, giftAmount);
      setGiftSuccess(response.message);
      setShowGiftConfirm(false);
      setGiftPhone("");
      setGiftAmount(1);
    } catch (error: any) {
      setGiftError(error.message || "Карт илгээхэд алдаа гарлаа");
      setShowGiftConfirm(false);
    } finally {
      setGiftLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Судалгааны карт
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Үлдэгдэл: <span className="font-semibold text-amber-600 dark:text-amber-400">{balance}</span> карт
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("gift")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "gift"
                ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Бэлэглэх
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Түүх
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* Gift Tab */}
          {activeTab === "gift" && (
            <div className="space-y-4">
              {giftError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {giftError}
                </div>
              )}
              {giftSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                  {giftSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Карт тоо
                </label>
                <input
                  type="number"
                  min="1"
                  max={balance}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  disabled={giftLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Хүлээн авагчийн утас
                </label>
                <input
                  type="tel"
                  value={giftPhone}
                  onChange={(e) => setGiftPhone(e.target.value)}
                  placeholder="99112233"
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  disabled={giftLoading}
                />
              </div>

              {showGiftConfirm && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>{giftAmount}</strong> карт <strong>{giftPhone}</strong> дугаарт илгээх гэж байна.
                    Таны картнаас хасагдана. Итгэлтэй байна уу?
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {showGiftConfirm && (
                  <button
                    onClick={() => setShowGiftConfirm(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={giftLoading}
                  >
                    Цуцлах
                  </button>
                )}
                <button
                  onClick={handleGiftSubmit}
                  disabled={giftLoading || !giftPhone || giftAmount < 1 || giftAmount > balance}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {giftLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Илгээж байна...
                    </span>
                  ) : showGiftConfirm ? (
                    "Тийм, илгээх"
                  ) : (
                    "Бэлэглэх"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {historyLoading && transactions.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm">Түүх хоосон байна</p>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${transactionTypeColors[tx.type] || "text-gray-600 dark:text-gray-400"}`}
                            >
                              {transactionTypeLabels[tx.type] || tx.type}
                            </span>
                            {tx.recipientPhone && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({tx.recipientPhone})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            tx.type === "order_deduction" || tx.type === "user_transfer" || tx.type === "agent_gift"
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {tx.type === "order_deduction" || tx.type === "user_transfer" || tx.type === "agent_gift" ? "-" : "+"}
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>

                  {hasMoreHistory && (
                    <button
                      onClick={() => fetchHistory(historyPage + 1)}
                      disabled={historyLoading}
                      className="w-full py-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                    >
                      {historyLoading ? "Ачаалж байна..." : "Цааш харах"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
