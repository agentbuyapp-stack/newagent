"use client";

import { memo, useState } from "react";
import { apiClient } from "@/lib/api";

interface TrackCodeSectionProps {
  orderId: string;
  trackCode?: string;
  onTrackCodeUpdated: () => void;
}

function TrackCodeSection({
  orderId,
  trackCode,
  onTrackCodeUpdated,
}: TrackCodeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [trackCodeInput, setTrackCodeInput] = useState(trackCode || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!trackCodeInput.trim()) {
      alert("Track code оруулах шаардлагатай");
      return;
    }

    setLoading(true);
    try {
      await apiClient.updateTrackCode(orderId, trackCodeInput.trim());
      setIsEditing(false);
      setTrackCodeInput("");
      onTrackCodeUpdated();
      alert("Track code амжилттай нэмэгдлээ");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Track Code</label>
          {!isEditing && (
            <button
              onClick={() => {
                setIsEditing(true);
                setTrackCodeInput(trackCode || "");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {trackCode ? "Засах" : "Нэмэх"}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={trackCodeInput}
              onChange={(e) => setTrackCodeInput(e.target.value)}
              placeholder="Track code оруулах"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              style={{ fontSize: "16px" }}
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 min-h-11"
              >
                {loading ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTrackCodeInput("");
                }}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium disabled:opacity-50 min-h-11"
              >
                Цуцлах
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            {trackCode ? (
              <p className="text-gray-900 font-mono">{trackCode}</p>
            ) : (
              <p className="text-gray-500 text-sm">Track code байхгүй байна</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TrackCodeSection);
