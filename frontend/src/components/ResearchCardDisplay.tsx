"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@/lib/useApiClient";
import CardActionsModal from "./CardActionsModal";

interface ResearchCardDisplayProps {
  userRole: string;
}

export default function ResearchCardDisplay({ userRole }: ResearchCardDisplayProps) {
  const apiClient = useApiClient();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBalance = async () => {
    try {
      const response = await apiClient.getCardBalance();
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Failed to fetch card balance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // Show for users and agents (not admin)
  if (userRole === "admin") {
    return null;
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Refresh balance after modal closes
    fetchBalance();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors group"
        title="Судалгааны карт"
      >
        {/* Card Icon */}
        <svg
          className="w-5 h-5 text-amber-600 dark:text-amber-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>

        {/* Balance */}
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 min-w-[1.5rem] text-center">
          {loading ? (
            <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            balance
          )}
        </span>

        {/* Tooltip indicator */}
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Судалгааны карт
        </span>
      </button>

      {/* Card Actions Modal */}
      <CardActionsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        balance={balance}
        userRole={userRole}
      />
    </>
  );
}
