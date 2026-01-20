"use client";

import React, { useState } from "react";
import { BundleOrder, BundleItem } from "@/lib/api";

interface BundleOrderDetailModalProps {
  bundleOrder: BundleOrder;
  onClose: () => void;
  exchangeRate?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "niitlegdsen": return "bg-gray-100 text-gray-800";
    case "agent_sudlaj_bn": return "bg-yellow-100 text-yellow-800";
    case "tolbor_huleej_bn": return "bg-blue-100 text-blue-800";
    case "amjilttai_zahialga": return "bg-green-100 text-green-800";
    case "tsutsalsan_zahialga": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "niitlegdsen": return "Шинэ";
    case "agent_sudlaj_bn": return "Судлагдаж буй";
    case "tolbor_huleej_bn": return "Төлбөр хүлээж";
    case "amjilttai_zahialga": return "Амжилттай";
    case "tsutsalsan_zahialga": return "Цуцлагдсан";
    default: return status;
  }
};

export default function BundleOrderDetailModal({
  bundleOrder,
  onClose,
  exchangeRate = 1,
}: BundleOrderDetailModalProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Calculate total amount
  const totalYuan = bundleOrder.items.reduce((sum, item) => {
    return sum + (item.agentReport?.userAmount || 0);
  }, 0);
  const totalMNT = totalYuan * exchangeRate;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Багц захиалга
                </h2>
                <p className="text-xs text-gray-500">{bundleOrder.items.length} бараа</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors min-h-10 min-w-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Overall Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Статус:</span>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(bundleOrder.status)}`}>
                {getStatusText(bundleOrder.status)}
              </span>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Хэрэглэгчийн мэдээлэл
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Нэр</p>
                  <p className="text-sm font-medium text-gray-900">{bundleOrder.userSnapshot.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Утас</p>
                  <p className="text-sm font-medium text-gray-900">{bundleOrder.userSnapshot.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Карго</p>
                  <p className="text-sm font-medium text-gray-900">{bundleOrder.userSnapshot.cargo}</p>
                </div>
              </div>
            </div>

            {/* Track Code */}
            {bundleOrder.trackCode && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div>
                    <p className="text-xs text-green-600">Трак код</p>
                    <p className="text-sm font-bold text-green-800">{bundleOrder.trackCode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Бараанууд</h3>
              <div className="space-y-3">
                {bundleOrder.items.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    exchangeRate={exchangeRate}
                    onImageClick={setZoomedImage}
                  />
                ))}
              </div>
            </div>

            {/* Total */}
            {totalYuan > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">Нийт дүн:</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-900">{totalYuan.toLocaleString()}¥</p>
                    <p className="text-sm text-purple-600">{totalMNT.toLocaleString()}₮</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Date */}
            <div className="text-xs text-gray-400 text-center">
              Үүсгэсэн: {new Date(bundleOrder.createdAt).toLocaleDateString("mn-MN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

// Individual item card
interface ItemCardProps {
  item: BundleItem;
  index: number;
  exchangeRate: number;
  onImageClick: (url: string) => void;
}

function ItemCard({ item, index, exchangeRate, onImageClick }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Item Header */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.imageUrls[0]}
                alt={item.productName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
              <h4 className="font-semibold text-gray-900 text-sm truncate">{item.productName}</h4>
            </div>
            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
            {item.agentReport && (
              <p className="text-xs text-green-600 font-medium mt-1">
                {item.agentReport.userAmount.toLocaleString()}¥ ({(item.agentReport.userAmount * exchangeRate).toLocaleString()}₮)
              </p>
            )}
          </div>

          {/* Status & Arrow */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(item.status)}`}>
              {getStatusText(item.status)}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-3">
          {/* Full Description */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Тайлбар</p>
            <p className="text-sm text-gray-700">{item.description}</p>
          </div>

          {/* Images */}
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Зурагнууд</p>
              <div className="grid grid-cols-3 gap-2">
                {item.imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageClick(url)}
                  >
                    <img src={url} alt={`${item.productName} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Report */}
          {item.agentReport && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Агентын тайлан</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Үнэ:</span>
                  <span className="font-semibold text-green-600">{item.agentReport.userAmount.toLocaleString()}¥</span>
                </div>
                {item.agentReport.quantity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Тоо ширхэг:</span>
                    <span className="font-medium">{item.agentReport.quantity}</span>
                  </div>
                )}
                {item.agentReport.additionalDescription && (
                  <div>
                    <span className="text-xs text-gray-500">Нэмэлт тайлбар:</span>
                    <p className="text-sm text-gray-700">{item.agentReport.additionalDescription}</p>
                  </div>
                )}
                {item.agentReport.paymentLink && (
                  <a
                    href={item.agentReport.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Төлбөрийн линк
                  </a>
                )}
                {item.agentReport.additionalImages && item.agentReport.additionalImages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Нэмэлт зурагнууд:</p>
                    <div className="grid grid-cols-4 gap-1">
                      {item.agentReport.additionalImages.map((url, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onImageClick(url)}
                        >
                          <img src={url} alt={`Additional ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
