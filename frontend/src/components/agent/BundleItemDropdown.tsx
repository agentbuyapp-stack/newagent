"use client";

import { useState } from "react";
import Image from "next/image";
import type { BundleOrder } from "@/lib/api";

interface BundleItemDropdownProps {
  item: BundleOrder["items"][0];
  index: number;
}

export function BundleItemDropdown({ item, index }: BundleItemDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          {item.imageUrls && item.imageUrls[0] ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-600 shrink-0 relative">
              <Image src={item.imageUrls[0]} alt={item.productName} fill sizes="40px" className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Бараа #{index + 1}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-gray-50 dark:bg-slate-800">
          {/* Images */}
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Зурагнууд</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {item.imageUrls.map((imgUrl, imgIndex) => (
                  <div key={imgIndex} className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                    <Image src={imgUrl} alt={`${item.productName} - ${imgIndex + 1}`} fill sizes="100px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Description */}
          {item.description && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Тайлбар</p>
              <p className="text-sm text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/50 rounded-lg p-2">{item.description}</p>
            </div>
          )}
          {/* Agent Report if exists */}
          {item.agentReport && (
            <div className="bg-green-900/30 rounded-lg p-3 border border-green-700 space-y-2">
              <p className="text-xs font-medium text-green-400 mb-2">Agent тайлан</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-green-400">Үнэ: <strong>{item.agentReport.userAmount?.toLocaleString()}¥</strong></span>
                {item.agentReport.quantity && <span className="text-slate-400">Тоо: x{item.agentReport.quantity}</span>}
              </div>
              {item.agentReport.paymentLink && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Төлбөрийн мэдээлэл:</p>
                  {item.agentReport.paymentLink.startsWith("http") ? (
                    <a href={item.agentReport.paymentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline break-all">
                      {item.agentReport.paymentLink}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-slate-300 break-all">{item.agentReport.paymentLink}</p>
                  )}
                </div>
              )}
              {item.agentReport.additionalDescription && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Нэмэлт тайлбар:</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{item.agentReport.additionalDescription}</p>
                </div>
              )}
              {item.agentReport.additionalImages && item.agentReport.additionalImages.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Нэмэлт зураг:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {item.agentReport.additionalImages.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                        <Image src={imgUrl} alt={`Report ${imgIdx + 1}`} fill sizes="100px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
