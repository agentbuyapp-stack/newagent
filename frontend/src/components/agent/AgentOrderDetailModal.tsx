"use client";

import { useState } from "react";
import Image from "next/image";
import type { Order, User, AgentReport, OrderStatus, BundleOrder } from "@/lib/api";
import type { useApiClient } from "@/lib/useApiClient";
import { OrderDetailHeader, UserContactInfo, OrderDates, BundleItemDropdown } from "@/components/agent";

interface AgentOrderDetailModalProps {
  order: Order;
  user: User | null;
  myOrders: Order[];
  agentReports: Record<string, AgentReport | null>;
  adminSettings: { exchangeRate?: number } | null;
  isEditingReport: boolean;
  setIsEditingReport: (editing: boolean) => void;
  editReportAmount: number;
  setEditReportAmount: (amount: number) => void;
  editReportReason: string;
  setEditReportReason: (reason: string) => void;
  editReportLoading: boolean;
  handleUpdateReport: (orderId: string) => Promise<void>;
  calculateUserPaymentAmount: (report: AgentReport | null, exchangeRate: number) => number;
  loadAgentReport: (orderId: string) => Promise<void>;
  apiClient: ReturnType<typeof useApiClient>;
  loadData: () => Promise<void>;
  statusUpdateLoading: boolean;
  handleUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  archiveLoading: boolean;
  handleArchiveOrder: (orderId: string) => Promise<void>;
  canArchiveOrder: (order: Order) => boolean;
  openCancelModal: (orderId: string) => void;
  onOpenChat: () => void;
  onOpenReportForm: (isBundleOrder: boolean) => void;
  onClose: () => void;
}

export function AgentOrderDetailModal({
  order: selectedOrder,
  user,
  myOrders,
  agentReports,
  adminSettings,
  isEditingReport,
  setIsEditingReport,
  editReportAmount,
  setEditReportAmount,
  editReportReason,
  setEditReportReason,
  editReportLoading,
  handleUpdateReport,
  calculateUserPaymentAmount,
  loadAgentReport,
  apiClient,
  loadData,
  statusUpdateLoading,
  handleUpdateOrderStatus,
  archiveLoading,
  handleArchiveOrder,
  canArchiveOrder,
  openCancelModal,
  onOpenChat,
  onOpenReportForm,
  onClose,
}: AgentOrderDetailModalProps) {
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(true);
  const [showAgentReportInModal, setShowAgentReportInModal] = useState(true);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [trackCodeInput, setTrackCodeInput] = useState(selectedOrder.trackCode || "");
  const [isEditingTrackCode, setIsEditingTrackCode] = useState(false);
  const [trackCodeLoading, setTrackCodeLoading] = useState(false);

  const mainImage = selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0
    ? selectedOrder.imageUrls[0]
    : null;

  const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
  const userSnapshot = (selectedOrder as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot;
  const bundleItems = (selectedOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems;

  const isMyOrder = myOrders.some((order) => order.id === selectedOrder.id);
  const isMyAssignedOrder = selectedOrder.agentId && selectedOrder.agentId === user?.id;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-2xl border border-gray-200 dark:border-slate-700 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <OrderDetailHeader
          isBundleOrder={!!isBundleOrder}
          bundleItemsCount={bundleItems?.length || 0}
          productName={selectedOrder.productName}
          status={selectedOrder.status}
          orderId={selectedOrder.id}
          mainImage={mainImage}
          onClose={onClose}
        />

        <div className="p-4 sm:p-6 space-y-5">
          {/* User Contact Info */}
          {(selectedOrder.user?.profile || userSnapshot) && (
            <UserContactInfo
              name={selectedOrder.user?.profile?.name || userSnapshot?.name}
              phone={selectedOrder.user?.profile?.phone || userSnapshot?.phone}
              cargo={selectedOrder.user?.profile?.cargo || userSnapshot?.cargo}
            />
          )}

          {/* Quick Actions for New Orders */}
          {selectedOrder.status === "niitlegdsen" && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-300">Шинэ захиалга</p>
                  <p className="text-sm text-amber-400/80">Энэ захиалгыг авч, судалж эхлэх үү?</p>
                </div>
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, "agent_sudlaj_bn")}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                >
                  Авах
                </button>
              </div>
            </div>
          )}

          {/* Report Required */}
          {selectedOrder.status === "agent_sudlaj_bn" && !agentReports[selectedOrder.id] && (
            <div className="bg-indigo-900/30 border border-indigo-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-800 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-indigo-300">Тайлан илгээх шаардлагатай</p>
                  <p className="text-sm text-indigo-400/80">Барааны үнэ, зураг зэргийг хэрэглэгчид илгээнэ үү</p>
                </div>
                <button
                  onClick={() => onOpenReportForm(!!isBundleOrder)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                >
                  Тайлан илгээх
                </button>
              </div>
            </div>
          )}

          {/* Product Details Card */}
          <ProductDetailsSection
            selectedOrder={selectedOrder}
            isBundleOrder={!!isBundleOrder}
            bundleItems={bundleItems}
            showUserInfoInModal={showUserInfoInModal}
            setShowUserInfoInModal={setShowUserInfoInModal}
            zoomedImageIndex={zoomedImageIndex}
            setZoomedImageIndex={setZoomedImageIndex}
          />

          {/* Agent Report Section (non-bundle) */}
          {(isMyOrder || isMyAssignedOrder) && !isBundleOrder && (
            <AgentReportSection
              selectedOrder={selectedOrder}
              agentReports={agentReports}
              adminSettings={adminSettings}
              showAgentReportInModal={showAgentReportInModal}
              setShowAgentReportInModal={setShowAgentReportInModal}
              isEditingReport={isEditingReport}
              setIsEditingReport={setIsEditingReport}
              editReportAmount={editReportAmount}
              setEditReportAmount={setEditReportAmount}
              editReportReason={editReportReason}
              setEditReportReason={setEditReportReason}
              editReportLoading={editReportLoading}
              handleUpdateReport={handleUpdateReport}
              calculateUserPaymentAmount={calculateUserPaymentAmount}
              loadAgentReport={loadAgentReport}
            />
          )}

          {/* Track Code Section */}
          {selectedOrder.status === "amjilttai_zahialga" &&
            (selectedOrder.agentId === user?.id || user?.role === "admin") && (
            <TrackCodeEditSection
              selectedOrder={selectedOrder}
              trackCodeInput={trackCodeInput}
              setTrackCodeInput={setTrackCodeInput}
              isEditingTrackCode={isEditingTrackCode}
              setIsEditingTrackCode={setIsEditingTrackCode}
              trackCodeLoading={trackCodeLoading}
              setTrackCodeLoading={setTrackCodeLoading}
              apiClient={apiClient}
              loadData={loadData}
            />
          )}

          {/* Dates Section */}
          <OrderDates createdAt={selectedOrder.createdAt} updatedAt={selectedOrder.updatedAt} />

          {/* Action Buttons */}
          <ActionButtons
            selectedOrder={selectedOrder}
            isBundleOrder={!!isBundleOrder}
            statusUpdateLoading={statusUpdateLoading}
            archiveLoading={archiveLoading}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
            handleArchiveOrder={handleArchiveOrder}
            canArchiveOrder={canArchiveOrder}
            openCancelModal={openCancelModal}
            onOpenReportForm={onOpenReportForm}
          />
        </div>
      </div>
    </div>
  );
}

// Product Details Section
function ProductDetailsSection({
  selectedOrder,
  isBundleOrder,
  bundleItems,
  showUserInfoInModal,
  setShowUserInfoInModal,
  zoomedImageIndex,
  setZoomedImageIndex,
}: {
  selectedOrder: Order;
  isBundleOrder: boolean;
  bundleItems?: BundleOrder["items"];
  showUserInfoInModal: boolean;
  setShowUserInfoInModal: (show: boolean) => void;
  zoomedImageIndex: number | null;
  setZoomedImageIndex: (index: number | null) => void;
}) {
  return (
    <div className="bg-gray-100 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
      <button
        onClick={() => setShowUserInfoInModal(!showUserInfoInModal)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-800 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">Барааны мэдээлэл</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${showUserInfoInModal ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showUserInfoInModal && (
        <div className="border-t border-gray-200 dark:border-slate-600 p-4 space-y-4 bg-slate-700/30">
          {isBundleOrder && bundleItems ? (
            <div className="space-y-2">
              {bundleItems.map((item, index) => (
                <BundleItemDropdown key={item.id || index} item={item} index={index} />
              ))}
            </div>
          ) : (
            <>
              {selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Зурагнууд</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedOrder.imageUrls.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-200 dark:bg-slate-600 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-purple-400 relative"
                        onClick={() => setZoomedImageIndex(zoomedImageIndex === index ? null : index)}
                      >
                        <Image src={imgUrl} alt={`${selectedOrder.productName} - ${index + 1}`} fill sizes="100px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                  {zoomedImageIndex !== null && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-70 p-4" onClick={() => setZoomedImageIndex(null)}>
                      <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
                        <Image src={selectedOrder.imageUrls[zoomedImageIndex]} alt={`${selectedOrder.productName} - ${zoomedImageIndex + 1}`} fill sizes="100vw" className="object-contain rounded-xl" />
                      </div>
                      <button onClick={() => setZoomedImageIndex(null)} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Барааны нэр</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">{selectedOrder.productName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Тайлбар</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap bg-gray-100 dark:bg-slate-700/50 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
                  {selectedOrder.description || "Тайлбар байхгүй"}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Agent Report Section
function AgentReportSection({
  selectedOrder,
  agentReports,
  adminSettings,
  showAgentReportInModal,
  setShowAgentReportInModal,
  isEditingReport,
  setIsEditingReport,
  editReportAmount,
  setEditReportAmount,
  editReportReason,
  setEditReportReason,
  editReportLoading,
  handleUpdateReport,
  calculateUserPaymentAmount,
  loadAgentReport,
}: {
  selectedOrder: Order;
  agentReports: Record<string, AgentReport | null>;
  adminSettings: { exchangeRate?: number } | null;
  showAgentReportInModal: boolean;
  setShowAgentReportInModal: (show: boolean) => void;
  isEditingReport: boolean;
  setIsEditingReport: (editing: boolean) => void;
  editReportAmount: number;
  setEditReportAmount: (amount: number) => void;
  editReportReason: string;
  setEditReportReason: (reason: string) => void;
  editReportLoading: boolean;
  handleUpdateReport: (orderId: string) => Promise<void>;
  calculateUserPaymentAmount: (report: AgentReport | null, exchangeRate: number) => number;
  loadAgentReport: (orderId: string) => Promise<void>;
}) {
  const report = agentReports[selectedOrder.id];
  const canEdit = selectedOrder.status === "tolbor_huleej_bn" && !selectedOrder.userPaymentVerified;
  const exchangeRate = adminSettings?.exchangeRate || 1;

  return (
    <div className="bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4">
      <button
        onClick={() => {
          setShowAgentReportInModal(!showAgentReportInModal);
          if (!showAgentReportInModal && agentReports[selectedOrder.id] === undefined) {
            loadAgentReport(selectedOrder.id);
          }
        }}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Миний илгээсэн тайлан</h3>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform ${showAgentReportInModal ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAgentReportInModal && (
        <div className="mt-4 space-y-4">
          {agentReports[selectedOrder.id] === undefined && (
            <div className="text-sm text-slate-400 text-center py-4">Ачааллаж байна...</div>
          )}
          {agentReports[selectedOrder.id] === null && (
            <div className="text-sm text-slate-400 text-center py-4">Тайлан байхгүй байна</div>
          )}
          {report && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-400">Юань дүн:</label>
                  {canEdit && !isEditingReport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingReport(true);
                        setEditReportAmount(report.userAmount);
                        setEditReportReason("");
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Засах
                    </button>
                  )}
                </div>
                {isEditingReport ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editReportAmount || ""}
                      onChange={(e) => setEditReportAmount(Math.round(parseFloat(e.target.value)) || 0)}
                      className="w-full px-3 py-2 text-base text-gray-900 dark:text-white bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Юань дүн оруулна уу"
                    />
                    <input
                      type="text"
                      value={editReportReason}
                      onChange={(e) => setEditReportReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Засварын шалтгаан (заавал биш)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditingReport(false);
                          setEditReportReason("");
                        }}
                        className="flex-1 px-3 py-2 text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 text-sm font-medium"
                      >
                        Цуцлах
                      </button>
                      <button
                        onClick={() => handleUpdateReport(selectedOrder.id)}
                        disabled={editReportLoading}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                      >
                        {editReportLoading ? "Хадгалж байна..." : "Хадгалах"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-amber-600 mt-1">¥{Math.round(report.userAmount).toLocaleString()}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Хэрэглэгчийн төлөх дүн:</label>
                <p className="text-lg font-semibold text-green-400 mt-1">
                  {Math.round(calculateUserPaymentAmount(report, exchangeRate)).toLocaleString()} ₮
                </p>
              </div>
              {report.editHistory && report.editHistory.length > 0 && (
                <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                  <label className="text-sm font-medium text-amber-400 block mb-2">Засварын түүх:</label>
                  <div className="space-y-1 text-xs text-amber-300">
                    {report.editHistory.map((edit, idx) => (
                      <p key={idx}>
                        • {new Date(edit.editedAt).toLocaleDateString("mn-MN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        : ¥{Math.round(edit.previousAmount).toLocaleString()} → ¥{Math.round(edit.newAmount).toLocaleString()}
                        {edit.reason && <span className="text-amber-600"> ({edit.reason})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {report.paymentLink && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Төлбөрийн холбоос:</label>
                  <a href={report.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all block mt-1">
                    {report.paymentLink}
                  </a>
                </div>
              )}
              {report.quantity && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Тоо ширхэг:</label>
                  <p className="text-white mt-1">{report.quantity}</p>
                </div>
              )}
              {report.additionalDescription && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Нэмэлт тайлбар:</label>
                  <p className="text-gray-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{report.additionalDescription}</p>
                </div>
              )}
              {report.additionalImages && report.additionalImages.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Нэмэлт зураг:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {report.additionalImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600">
                        <Image src={imgUrl} alt={`Additional ${idx + 1}`} fill sizes="150px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Track Code Edit Section
function TrackCodeEditSection({
  selectedOrder,
  trackCodeInput,
  setTrackCodeInput,
  isEditingTrackCode,
  setIsEditingTrackCode,
  trackCodeLoading,
  setTrackCodeLoading,
  apiClient,
  loadData,
}: {
  selectedOrder: Order;
  trackCodeInput: string;
  setTrackCodeInput: (value: string) => void;
  isEditingTrackCode: boolean;
  setIsEditingTrackCode: (editing: boolean) => void;
  trackCodeLoading: boolean;
  setTrackCodeLoading: (loading: boolean) => void;
  apiClient: ReturnType<typeof useApiClient>;
  loadData: () => Promise<void>;
}) {
  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Track Code</label>
          {!isEditingTrackCode && (
            <button
              onClick={() => {
                setIsEditingTrackCode(true);
                setTrackCodeInput(selectedOrder.trackCode || "");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedOrder.trackCode ? "Засах" : "Нэмэх"}
            </button>
          )}
        </div>
        {isEditingTrackCode ? (
          <div className="space-y-2">
            <input
              type="text"
              value={trackCodeInput}
              onChange={(e) => setTrackCodeInput(e.target.value)}
              placeholder="Track code оруулах"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              style={{ fontSize: "16px" }}
              disabled={trackCodeLoading}
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!trackCodeInput.trim()) {
                    alert("Track code оруулах шаардлагатай");
                    return;
                  }
                  setTrackCodeLoading(true);
                  try {
                    await apiClient.updateTrackCode(selectedOrder.id, trackCodeInput.trim());
                    setIsEditingTrackCode(false);
                    setTrackCodeInput("");
                    await loadData();
                    alert("Track code амжилттай нэмэгдлээ");
                  } catch (e: unknown) {
                    alert(e instanceof Error ? e.message : "Алдаа гарлаа");
                  } finally {
                    setTrackCodeLoading(false);
                  }
                }}
                disabled={trackCodeLoading}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 min-h-11"
              >
                {trackCodeLoading ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                onClick={() => {
                  setIsEditingTrackCode(false);
                  setTrackCodeInput("");
                }}
                disabled={trackCodeLoading}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium disabled:opacity-50 min-h-11"
              >
                Цуцлах
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-3">
            {selectedOrder.trackCode ? (
              <p className="text-white font-mono">{selectedOrder.trackCode}</p>
            ) : (
              <p className="text-slate-400 text-sm">Track code байхгүй байна</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Action Buttons Section
function ActionButtons({
  selectedOrder,
  isBundleOrder,
  statusUpdateLoading,
  archiveLoading,
  handleUpdateOrderStatus,
  handleArchiveOrder,
  canArchiveOrder,
  openCancelModal,
  onOpenReportForm,
}: {
  selectedOrder: Order;
  isBundleOrder: boolean;
  statusUpdateLoading: boolean;
  archiveLoading: boolean;
  handleUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  handleArchiveOrder: (orderId: string) => Promise<void>;
  canArchiveOrder: (order: Order) => boolean;
  openCancelModal: (orderId: string) => void;
  onOpenReportForm: (isBundleOrder: boolean) => void;
}) {
  return (
    <div className="space-y-3 pt-2">
      {selectedOrder.status === "niitlegdsen" && (
        <button
          onClick={() => handleUpdateOrderStatus(selectedOrder.id, "agent_sudlaj_bn")}
          disabled={statusUpdateLoading}
          className="w-full px-4 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {statusUpdateLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          {statusUpdateLoading ? "Уншиж байна..." : "Захиалга авах"}
        </button>
      )}

      {selectedOrder.status === "agent_sudlaj_bn" && (
        <>
          <button
            onClick={() => onOpenReportForm(isBundleOrder)}
            className="w-full px-4 py-3 bg-linear-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Тайлан илгээх
          </button>
          <button
            onClick={() => openCancelModal(selectedOrder.id)}
            className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Захиалга цуцлах
          </button>
        </>
      )}

      {canArchiveOrder(selectedOrder) && (
        <button
          onClick={() => handleArchiveOrder(selectedOrder.id)}
          disabled={archiveLoading}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {archiveLoading ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          )}
          {archiveLoading ? "Уншиж байна..." : "Архивлах"}
        </button>
      )}
    </div>
  );
}
