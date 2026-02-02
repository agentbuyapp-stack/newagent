"use client";

import React from "react";

interface CancelOrderModalProps {
  isOpen: boolean;
  cancelReason: string;
  cancelLoading: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export default function CancelOrderModal({
  isOpen,
  cancelReason,
  cancelLoading,
  onReasonChange,
  onCancel,
  onConfirm,
}: CancelOrderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Захиалга цуцлах
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Цуцлах шалтгаанаа бичнэ үү
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Шалтгаан <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Захиалга цуцлах шалтгаанаа дэлгэрэнгүй бичнэ үү..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              rows={4}
              style={{ fontSize: "16px" }}
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Хамгийн багадаа 5 тэмдэгт ({cancelReason.length}/5)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl font-semibold transition-colors min-h-12"
            >
              Буцах
            </button>
            <button
              onClick={() => onConfirm(cancelReason)}
              disabled={cancelLoading || cancelReason.trim().length < 5}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-12"
            >
              {cancelLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              {cancelLoading ? "Цуцлаж байна..." : "Цуцлах"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
