"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";

interface PackagePurchaseProps {
  onSuccess?: () => void;
}

const PACKAGES = [
  { type: "5" as const, count: 5, label: "5 захиалга", description: "Жижиг багц" },
  { type: "10" as const, count: 10, label: "10 захиалга", description: "Дунд багц" },
  { type: "20" as const, count: 20, label: "20 захиалга", description: "Том багц" },
];

export default function PackagePurchase({ onSuccess }: PackagePurchaseProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePurchase = async (packageType: "5" | "10" | "20") => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.purchasePackage(packageType);
      setSuccess("Багц худалдан авах хүсэлт илгээгдлэа. Админ баталгаажуулсны дараа идэвхжинэ.");
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Алдаа гарлаа";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Захиалгын багц авах</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Танд захиалга үүсгэх эрх дууссан байна. Багц авснаар захиалга үүсгэх боломжтой.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.type}
            onClick={() => handlePurchase(pkg.type)}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{pkg.count}</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{pkg.label}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">{pkg.description}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
        Хүсэлт илгээсний дараа админ баталгаажуулснаар таны данс руу захиалгын эрх нэмэгдэнэ.
      </p>
    </div>
  );
}
