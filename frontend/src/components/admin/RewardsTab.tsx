"use client";

import type { RewardRequest } from "@/lib/api";

interface RewardsTabProps {
  rewardRequests: RewardRequest[];
  onApproveReward: (requestId: string, amount: number) => Promise<void>;
  onRejectReward: (requestId: string, amount: number) => Promise<void>;
}

export function RewardsTab({
  rewardRequests,
  onApproveReward,
  onRejectReward,
}: RewardsTabProps) {
  const pendingRequests = rewardRequests.filter((r) => r.status === "pending");
  const approvedRequests = rewardRequests.filter((r) => r.status === "approved");
  const rejectedRequests = rewardRequests.filter((r) => r.status === "rejected");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        Урамшуулал хүсэлтүүд
      </h3>

      <div className="space-y-6">
        {/* Pending Requests */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Хүлээж байгаа хүсэлтүүд ({pendingRequests.length})
          </h4>
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-xl p-4 bg-white"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Agent:{" "}
                        {request.agent?.profile?.name ||
                          request.agent?.email ||
                          "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Утас: {request.agent?.profile?.phone || "Байхгүй"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Имэйл: {request.agent?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-green-600">
                        {formatAmount(request.amount)} ₮
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveReward(request.id, request.amount)}
                      className="px-4 py-2.5 text-sm text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium min-h-10"
                    >
                      Батлах
                    </button>
                    <button
                      onClick={() => onRejectReward(request.id, request.amount)}
                      className="px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10"
                    >
                      Татгалзах
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
              Хүлээж байгаа урамшуулал хүсэлт байхгүй байна.
            </div>
          )}
        </div>

        {/* Approved Requests */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Батлагдсан урамшууллууд ({approvedRequests.length})
          </h4>
          {approvedRequests.length > 0 ? (
            <div className="space-y-3">
              {approvedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-green-200 rounded-xl p-4 bg-green-50"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Agent:{" "}
                        {request.agent?.profile?.name ||
                          request.agent?.email ||
                          "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Утас: {request.agent?.profile?.phone || "Байхгүй"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Имэйл: {request.agent?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-green-600">
                        {formatAmount(request.amount)} ₮
                      </p>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1 inline-block">
                        Батлагдсан
                      </span>
                      {request.approvedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(request.approvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
              Батлагдсан урамшуулал байхгүй байна.
            </div>
          )}
        </div>

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Татгалзсан хүсэлтүүд ({rejectedRequests.length})
            </h4>
            <div className="space-y-3">
              {rejectedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-red-200 rounded-xl p-4 bg-red-50"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Agent:{" "}
                        {request.agent?.profile?.name ||
                          request.agent?.email ||
                          "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Утас: {request.agent?.profile?.phone || "Байхгүй"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Имэйл: {request.agent?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-red-600">
                        {formatAmount(request.amount)} ₮
                      </p>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1 inline-block">
                        Татгалзсан
                      </span>
                      {request.rejectedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(request.rejectedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
