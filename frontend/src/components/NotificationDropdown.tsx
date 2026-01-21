"use client";

import { useState, useEffect, useRef } from "react";
import { useApiClient } from "@/lib/useApiClient";
import { Notification } from "@/lib/api";

const notificationTypeLabels: Record<string, string> = {
  agent_report_sent: "Тайлан ирлээ",
  agent_cancelled_order: "Захиалга цуцлагдлаа",
  admin_cancelled_order: "Захиалга цуцлагдлаа",
  agent_added_track_code: "Track код",
  new_order_available: "Шинэ захиалга",
  payment_verified: "Төлбөр баталгаажлаа",
  payment_verification_request: "Төлбөр хүсэлт",
  reward_request: "Урамшуулал хүсэлт",
};

const notificationTypeColors: Record<string, string> = {
  agent_report_sent: "bg-blue-100 text-blue-800",
  agent_cancelled_order: "bg-red-100 text-red-800",
  admin_cancelled_order: "bg-red-100 text-red-800",
  agent_added_track_code: "bg-green-100 text-green-800",
  new_order_available: "bg-yellow-100 text-yellow-800",
  payment_verified: "bg-green-100 text-green-800",
  payment_verification_request: "bg-orange-100 text-orange-800",
  reward_request: "bg-purple-100 text-purple-800",
};

export default function NotificationDropdown() {
  const apiClient = useApiClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.getNotificationCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getNotifications(1, 10);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notification as read and auto-delete
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      // Mark as read if not already
      if (!notification.isRead) {
        await apiClient.markNotificationAsRead(notification.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      // Auto-delete the notification after viewing
      await apiClient.deleteNotification(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (error) {
      console.error("Failed to handle notification:", error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      // Delete all notifications one by one
      for (const notification of notifications) {
        await apiClient.deleteNotification(notification.id);
      }
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.deleteNotification(notificationId);
      const deletedNotification = notifications.find(
        (n) => n.id === notificationId,
      );
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Саяхан";
    if (diffMins < 60) return `${diffMins} мин`;
    if (diffHours < 24) return `${diffHours} цаг`;
    if (diffDays < 7) return `${diffDays} өдөр`;
    return date.toLocaleDateString("mn-MN");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Мэдэгдэл"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-4.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Мэдэгдэл</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-sm">Мэдэгдэл байхгүй</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification, index) => (
                  <li
                    key={`${notification.id}-${index}`}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              notificationTypeColors[notification.type] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notificationTypeLabels[notification.type] ||
                              notification.type}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                        title="Устгах"
                      >
                        <svg
                          className="w-4 h-4"
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
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page if needed
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
              >
                Бүгдийг харах
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
