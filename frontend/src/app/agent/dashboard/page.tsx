"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { type User, type Profile, type Order, type OrderStatus, type AgentReport } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import ChatModal from "@/components/ChatModal";
import AgentReportForm from "@/components/AgentReportForm";

export default function AgentDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportOrder, setReportOrder] = useState<Order | null>(null);
  const [showPublishedOrders, setShowPublishedOrders] = useState(true);
  const [showMyOrders, setShowMyOrders] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "completed" | "cancelled">("completed");
  const [agentReports, setAgentReports] = useState<Record<string, AgentReport | null>>({});
  const [expandedReportOrderId, setExpandedReportOrderId] = useState<string | null>(null);
  const [adminSettings, setAdminSettings] = useState<{ accountNumber?: string; accountName?: string; bank?: string; exchangeRate?: number } | null>(null);
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [showAgentReportInModal, setShowAgentReportInModal] = useState(false);
  const [trackCodeInput, setTrackCodeInput] = useState("");
  const [isEditingTrackCode, setIsEditingTrackCode] = useState(false);
  const [trackCodeLoading, setTrackCodeLoading] = useState(false);
  const [editingTrackCodeOrderId, setEditingTrackCodeOrderId] = useState<string | null>(null);
  const [trackCodeInputs, setTrackCodeInputs] = useState<Record<string, string>>({});

  // Load agent report when order modal opens
  useEffect(() => {
    if (showOrderModal && selectedOrder && user?.id) {
      // Check if this order is in "myOrders" (agent's own orders)
      // Calculate myOrders here to avoid dependency issues
      const calculatedMyOrders = orders.filter(order => {
        if (user?.role === "admin") {
          return order.status !== "niitlegdsen";
        }
        return order.agentId === user?.id && (
          order.status === "agent_sudlaj_bn" || 
          order.status === "tolbor_huleej_bn" || 
          order.status === "amjilttai_zahialga"
        );
      });
      const isMyOrder = calculatedMyOrders.some(order => order.id === selectedOrder.id);
      
      // Load report if current user is the agent for this order
      if (selectedOrder.agentId === user.id && agentReports[selectedOrder.id] === undefined) {
        loadAgentReport(selectedOrder.id);
      }
      
      // If agent report exists, collapse user info by default and expand agent report
      if (agentReports[selectedOrder.id]) {
        setShowUserInfoInModal(false);
        setShowAgentReportInModal(true);
      } else if (isMyOrder || selectedOrder.agentId === user.id) {
        // If order is in "myOrders" or user is the agent, show agent report dropdown
        setShowUserInfoInModal(true);
        setShowAgentReportInModal(true); // Show dropdown even if report not loaded yet
      } else {
        setShowUserInfoInModal(true);
        setShowAgentReportInModal(false);
      }
      
      // Reset track code input when modal opens (only if not editing)
      if (!isEditingTrackCode) {
        setTrackCodeInput(selectedOrder.trackCode || "");
      }
    }
  }, [showOrderModal, selectedOrder?.id, selectedOrder?.agentId, selectedOrder?.trackCode, user?.id, user?.role, agentReports, orders, isEditingTrackCode]);

  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/");
      return;
    }
    if (isLoaded && clerkUser) {
      loadData();
    }
  }, [isLoaded, clerkUser, router]);

  const loadData = async () => {
    if (!clerkUser) return;
    
    try {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      if (!email) {
        setError("Имэйл олдсонгүй");
        setLoading(false);
        return;
      }

      // Get user from database (Clerk middleware will create if doesn't exist)
      try {
        const userData = await apiClient.getMe();
        setUser(userData);
        
        // If user role, automatically register as agent
        if (userData.role === "user") {
          try {
            const updatedUser = await apiClient.registerAsAgent();
            setUser(updatedUser);
            setIsApproved(updatedUser.isApproved || false);
            if (updatedUser.profile) {
              setProfile(updatedUser.profile);
            }
            // Reload data after registering as agent
            await loadData();
            return;
          } catch (registerErr: any) {
            setError(registerErr.message || "Agent бүртгэл үүсгэхэд алдаа гарлаа");
            setLoading(false);
            return;
          }
        }
        // Allow both admin and agent roles to access agent dashboard
        // Admin can access all dashboards (user, agent, admin)
        if (userData.role !== "agent" && userData.role !== "admin") {
          setError("Та agent эрхгүй байна");
          setLoading(false);
          return;
        }
        
        setIsApproved(userData.isApproved || false);
        if (userData.profile) {
          setProfile(userData.profile);
        }
        
        // Load all orders (Approved agents can see all orders, unapproved only see their own)
        try {
          const ordersData = await apiClient.getOrders();
          setOrders(ordersData);
          
          // Load agent reports for orders that have agent assigned (including completed orders)
          const reports: Record<string, AgentReport | null> = {};
          for (const order of ordersData) {
            if (order.agentId === userData.id && (order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga")) {
              try {
                const report = await apiClient.getAgentReport(order.id);
                reports[order.id] = report;
              } catch (err) {
                reports[order.id] = null;
              }
            }
          }
          setAgentReports(reports);
        } catch (err) {
          console.log("No orders found");
        }
        
        // Load admin settings for exchange rate calculation
        try {
          const settings = await apiClient.getAdminSettings();
          setAdminSettings(settings);
        } catch (err) {
          // Admin settings might not be set yet, that's okay
        }
      } catch (err: any) {
        // If user doesn't exist, the backend will create it automatically via Clerk middleware
        // Just retry after a moment
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);
            
            // Check role again on retry
            // If user role, automatically register as agent
            if (userData.role === "user") {
              try {
                const updatedUser = await apiClient.registerAsAgent();
                setUser(updatedUser);
                setIsApproved(updatedUser.isApproved || false);
                if (updatedUser.profile) {
                  setProfile(updatedUser.profile);
                }
                // Reload data after registering as agent
                await loadData();
                return;
              } catch (registerErr: any) {
                setError(registerErr.message || "Agent бүртгэл үүсгэхэд алдаа гарлаа");
                return;
              }
            }
            // Allow both admin and agent roles to access agent dashboard
            if (userData.role !== "agent" && userData.role !== "admin") {
              setError("Та agent эрхгүй байна");
              return;
            }
            
            setIsApproved(userData.isApproved || false);
            if (userData.profile) {
              setProfile(userData.profile);
            }
          } catch (retryErr: any) {
            setError(retryErr.message || "Алдаа гарлаа");
          }
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };


  const loadAgentReport = async (orderId: string) => {
    try {
      const report = await apiClient.getAgentReport(orderId);
      setAgentReports(prev => ({ ...prev, [orderId]: report }));
    } catch (err) {
      setAgentReports(prev => ({ ...prev, [orderId]: null }));
    }
  };

  // Calculate user payment amount: agent report userAmount * exchangeRate * 1.05
  const calculateUserPaymentAmount = (agentReport: AgentReport | null, exchangeRate: number = 1): number => {
    if (!agentReport) return 0;
    return agentReport.userAmount * exchangeRate * 1.05;
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await apiClient.updateOrderStatus(orderId, newStatus);
    await loadData();
      setShowOrderModal(false);
      
      // Update order filter based on new status
      if (newStatus === "amjilttai_zahialga" || newStatus === "tsutsalsan_zahialga") {
        setOrderFilter("completed");
      } else if (newStatus === "agent_sudlaj_bn" || newStatus === "tolbor_huleej_bn") {
        setOrderFilter("active");
      }
      
      alert("Захиалгын статус амжилттай шинэчлэгдлээ");
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "niitlegdsen": return "bg-gray-100 text-gray-800";
      case "agent_sudlaj_bn": return "bg-yellow-100 text-yellow-800";
      case "tolbor_huleej_bn": return "bg-blue-100 text-blue-800";
      case "amjilttai_zahialga": return "bg-green-100 text-green-800";
      case "tsutsalsan_zahialga": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "niitlegdsen": return "Нийтэлсэн";
      case "agent_sudlaj_bn": return "Agent шалгаж байна";
      case "tolbor_huleej_bn": return "Төлбөр хүлээж байна";
      case "amjilttai_zahialga": return "Амжилттай захиалга";
      case "tsutsalsan_zahialga": return "Цуцлагдсан захиалга";
      default: return status;
    }
  };

  // Memoize filtered orders to avoid recalculating on every render
  const publishedOrders = useMemo(() => 
    orders.filter(order => order.status === "niitlegdsen"),
    [orders]
  );
  
  const myOrders = useMemo(() => {
    // For admin, show all orders that are not "niitlegdsen"
    if (user?.role === "admin") {
      return orders.filter(order => order.status !== "niitlegdsen");
    }
    // For agents, show only their assigned orders
    return orders.filter(order => 
      order.agentId === user?.id && (
        order.status === "agent_sudlaj_bn" || 
        order.status === "tolbor_huleej_bn" || 
        order.status === "amjilttai_zahialga"
      )
    );
  }, [orders, user?.role, user?.id]);

  // Memoize filtered orders for "My Orders" section
  const filteredMyOrders = useMemo(() => {
    return myOrders.filter((order) => {
      if (orderFilter === "all") return true;
      if (orderFilter === "active") {
        return order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn";
      }
      if (orderFilter === "completed") {
        // Амжилттай захиалга: зөвхөн амжилттай захиалга
        return order.status === "amjilttai_zahialga";
      }
      if (orderFilter === "cancelled") {
        // Цуцлагдсан захиалга
        return order.status === "tsutsalsan_zahialga";
      }
      return true;
    });
  }, [myOrders, orderFilter]);

  const handleClearCancelledOrder = async (orderId: string) => {
    if (!confirm("Та энэ цуцлагдсан захиалгыг устгахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      await apiClient.cancelOrder(orderId);
      await loadData();
      alert("Цуцлагдсан захиалга амжилттай устгагдлаа");
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
    }
  };

  const handleClearAllCancelledOrders = async () => {
    const cancelledOrders = filteredMyOrders.filter(order => order.status === "tsutsalsan_zahialga");
    if (cancelledOrders.length === 0) {
      alert("Цуцлагдсан захиалга байхгүй байна");
      return;
    }

    if (!confirm(`Та ${cancelledOrders.length} цуцлагдсан захиалгыг бүгдийг нь устгахдаа итгэлтэй байна уу?`)) {
      return;
    }

    try {
      // Delete all cancelled orders
      await Promise.all(cancelledOrders.map(order => apiClient.cancelOrder(order.id)));
      await loadData();
      alert(`${cancelledOrders.length} цуцлагдсан захиалга амжилттай устгагдлаа`);
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-base text-gray-600">Ачааллаж байна...</div>
      </div>
    );
  }

  if (!clerkUser) {
    return null;
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-base">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
  

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Approval Status - Only show for agents, not admins */}
          {user?.role === "agent" && !isApproved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin шийдвэр хүлээж байна</h3>
                  <p className="text-sm text-gray-600">Таны эрх admin-аар батлагдаагүй байна. Батлагдсаны дараа "нийтэлсэн" захиалгуудыг харж болно.</p>
                </div>
              </div>
            </div>
          )}

          {/* Box 1: Нийтэлсэн захиалгууд */}
          {(user?.role === "admin" || isApproved) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Нээлттэй захиалгууд</h2>
              <button
                onClick={() => setShowPublishedOrders(!showPublishedOrders)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <svg 
                  className={`w-5 h-5 transition-transform ${showPublishedOrders ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {showPublishedOrders && (
              <div className="space-y-3 sm:space-y-4">
                {publishedOrders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {publishedOrders.map((order) => {
                      const mainImage = (order.imageUrls && order.imageUrls.length > 0) 
                        ? order.imageUrls[0] 
                        : order.imageUrl || null;
                      
                      return (
                        <div 
                          key={order.id} 
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden cursor-pointer"
                        >
                          {mainImage && (
                            <div className="w-full h-40 bg-gray-200 overflow-hidden">
                              <img
                                src={mainImage}
                                alt={order.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-mono text-gray-500">ID: {order.id.slice(0, 8)}...</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>

                            <h4 className="font-semibold text-gray-900 text-base line-clamp-1">
                              {order.productName}
                            </h4>

                            <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                              {order.description}
                            </p>

                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                    Нийтэлсэн захиалга байхгүй байна.
                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {/* Box 2: Миний захиалгууд */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Миний захиалгууд</h2>
              <button
                onClick={() => setShowMyOrders(!showMyOrders)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <svg 
                  className={`w-5 h-5 transition-transform ${showMyOrders ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                </button>
            </div>
            
            {showMyOrders && (
              <div className="space-y-4">
                {/* Category tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      orderFilter === "all"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Бүгд
                  </button>
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      orderFilter === "active"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Идэвхтэй
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      orderFilter === "completed"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Амжилттай захиалга
                  </button>
                  <button
                    onClick={() => setOrderFilter("cancelled")}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      orderFilter === "cancelled"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Цуцлагдсан захиалга
                  </button>
                </div>
                
                {/* Clear All button for cancelled orders */}
                {orderFilter === "cancelled" && filteredMyOrders.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleClearAllCancelledOrders}
                      className="px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[40px]"
                    >
                      Бүгдийг устгах (Clear All)
                    </button>
                  </div>
                )}

                {/* Filtered orders */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredMyOrders.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {filteredMyOrders.map((order) => {
                          const mainImage = (order.imageUrls && order.imageUrls.length > 0) 
                            ? order.imageUrls[0] 
                            : order.imageUrl || null;
                          
                          return (
                            <div 
                              key={order.id} 
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden cursor-pointer"
                            >
                              {mainImage && (
                                <div className="w-full h-40 bg-gray-200 overflow-hidden">
                                  <img
                                    src={mainImage}
                                    alt={order.productName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-mono text-gray-500">ID: {order.id.slice(0, 8)}...</p>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                  </span>
                                </div>

                                {/* Product Name - Collapsed if agent report exists */}
                                {agentReports[order.id] && expandedReportOrderId !== order.id ? (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-900 text-base line-clamp-1 opacity-50">
                                      {order.productName}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-1 opacity-50">
                                      {order.description}
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="font-semibold text-gray-900 text-base line-clamp-1">
                                      {order.productName}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                                      {order.description}
                                    </p>
                                  </>
                                )}

                                {/* Agent Report Price - Show on card if report exists */}
                                {agentReports[order.id] && expandedReportOrderId !== order.id && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-gray-700">
                                        {order.status === "amjilttai_zahialga" ? "Төлсөн дүн:" : "Хэрэглэгчийн төлөх дүн:"}
                                      </span>
                                      <span className="text-lg font-bold text-green-600">
                                        {(() => {
                                          const exchangeRate = adminSettings?.exchangeRate || 1;
                                          const calculatedAmount = calculateUserPaymentAmount(agentReports[order.id], exchangeRate);
                                          return calculatedAmount.toLocaleString();
                                        })()} ₮
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Track Code Section - Show for successful orders on card */}
                                {order.status === "amjilttai_zahialga" && (order.agentId === user?.id || user?.role === "admin") && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-gray-700">Track Code</label>
                                        {editingTrackCodeOrderId !== order.id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingTrackCodeOrderId(order.id);
                                              setTrackCodeInputs(prev => ({ ...prev, [order.id]: order.trackCode || "" }));
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                          >
                                            {order.trackCode ? "Засах" : "Нэмэх"}
                                          </button>
                                        )}
                                      </div>
                                      
                                      {editingTrackCodeOrderId === order.id ? (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={trackCodeInputs[order.id] || ""}
                                            onChange={(e) => {
                                              setTrackCodeInputs(prev => ({ ...prev, [order.id]: e.target.value }));
                                            }}
                                            placeholder="Track code оруулах"
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                            style={{ fontSize: '16px' }}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={trackCodeLoading}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                const trackCode = trackCodeInputs[order.id]?.trim();
                                                if (!trackCode) {
                                                  alert("Track code оруулах шаардлагатай");
                                                  return;
                                                }
                                                
                                                setTrackCodeLoading(true);
                                                try {
                                                  const updatedOrder = await apiClient.updateTrackCode(order.id, trackCode);
                                                  // Update order in the list
                                                  setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
                                                  setEditingTrackCodeOrderId(null);
                                                  setTrackCodeInputs(prev => {
                                                    const newInputs = { ...prev };
                                                    delete newInputs[order.id];
                                                    return newInputs;
                                                  });
                                                  alert("Track code амжилттай нэмэгдлээ");
                                                } catch (err: any) {
                                                  alert(err.message || "Алдаа гарлаа");
                                                } finally {
                                                  setTrackCodeLoading(false);
                                                }
                                              }}
                                              disabled={trackCodeLoading}
                                              className="flex-1 px-2 py-1.5 text-xs bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 min-h-[32px]"
                                            >
                                              {trackCodeLoading ? "Хадгалж..." : "Хадгалах"}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTrackCodeOrderId(null);
                                                setTrackCodeInputs(prev => {
                                                  const newInputs = { ...prev };
                                                  delete newInputs[order.id];
                                                  return newInputs;
                                                });
                                              }}
                                              disabled={trackCodeLoading}
                                              className="px-2 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium disabled:opacity-50 min-h-[32px]"
                                            >
                                              Цуцлах
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                                          {order.trackCode ? (
                                            <p className="text-xs font-mono text-blue-600 font-semibold">{order.trackCode}</p>
                                          ) : (
                                            <p className="text-xs text-gray-500">Track code байхгүй</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Clear button for cancelled orders */}
                                {order.status === "tsutsalsan_zahialga" && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearCancelledOrder(order.id);
                                      }}
                                      className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors text-sm font-medium min-h-[44px]"
                                    >
                                      Устгах (Clear)
                                    </button>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric"
                                    })}
                                  </p>
                                </div>

                                {/* Chat Button on Order Card - Show for active and completed orders */}
                                {(order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga") && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChatOrder(order);
                                        setShowChatModal(true);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                      Чат нээх
                                    </button>
                                  </div>
                                )}

                                {/* Agent Report Dropdown - Show for orders with agent report */}
                                {order.agentId && (order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga") && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (expandedReportOrderId === order.id) {
                                          setExpandedReportOrderId(null);
                                        } else {
                                          setExpandedReportOrderId(order.id);
                                          if (agentReports[order.id] === undefined) {
                                            loadAgentReport(order.id);
                                          }
                                        }
                                      }}
                                      className="w-full flex items-center justify-between text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                                    >
                                      <span className="font-medium">Agent-ийн тайлан</span>
                                      <svg 
                                        className={`w-4 h-4 transition-transform ${expandedReportOrderId === order.id ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                    
                                    {expandedReportOrderId === order.id && agentReports[order.id] && (
                                      <div className="mt-2 p-3 bg-gray-50 rounded-xl space-y-2 text-xs">
                                        <div>
                                          <span className="font-medium text-gray-900">Хэрэглэгчийн төлөх дүн:</span>
                                          <span className="ml-2 text-gray-900">
                                            {(() => {
                                              const exchangeRate = adminSettings?.exchangeRate || 1;
                                              const calculatedAmount = calculateUserPaymentAmount(agentReports[order.id], exchangeRate);
                                              return calculatedAmount.toLocaleString();
                                            })()} ₮
                                          </span>
                                        </div>
                                        {agentReports[order.id]?.paymentLink && (
                                          <div>
                                            <span className="font-medium text-gray-900">Төлбөрийн холбоос:</span>
                                            <a 
                                              href={agentReports[order.id]?.paymentLink} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="ml-2 text-blue-800 hover:underline break-all"
                                            >
                                              {agentReports[order.id]?.paymentLink}
                                            </a>
                                          </div>
                                        )}
                                        {agentReports[order.id]?.quantity && (
                                          <div>
                                            <span className="font-medium text-gray-900">Тоо ширхэг:</span>
                                            <span className="ml-2 text-gray-900">{agentReports[order.id]?.quantity}</span>
                                          </div>
                                        )}
                                        {agentReports[order.id]?.additionalDescription && (
                                          <div>
                                            <span className="font-medium text-gray-900">Нэмэлт тайлбар:</span>
                                            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{agentReports[order.id]?.additionalDescription}</p>
                                          </div>
                                        )}
                                        {agentReports[order.id]?.additionalImages && agentReports[order.id]!.additionalImages.length > 0 && (
                                          <div>
                                            <span className="font-medium text-gray-900">Нэмэлт зураг:</span>
                                            <div className="mt-2 grid grid-cols-3 gap-2">
                                              {agentReports[order.id]!.additionalImages.map((imgUrl, idx) => (
                                                <img
                                                  key={idx}
                                                  src={imgUrl}
                                                  alt={`Additional ${idx + 1}`}
                                                  className="w-full h-20 object-cover rounded border border-gray-200"
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {expandedReportOrderId === order.id && agentReports[order.id] === null && (
                                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
                                        Тайлан байхгүй байна
                                      </div>
                                    )}
                                    
                                    {expandedReportOrderId === order.id && agentReports[order.id] === undefined && (
                                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
                                        Ачааллаж байна...
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                        <p>
                          {orderFilter === "all" && "Миний захиалга байхгүй байна."}
                          {orderFilter === "active" && "Идэвхтэй захиалга байхгүй байна."}
                          {orderFilter === "completed" && "Амжилттай захиалга байхгүй байна."}
                          {orderFilter === "cancelled" && "Цуцлагдсан захиалга байхгүй байна."}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (() => {
        // For agent dashboard, show report if current user is the agent for this order
        const currentReport = selectedOrder.agentId === user?.id ? agentReports[selectedOrder.id] : undefined;
        const hasAgentReport = currentReport !== null && currentReport !== undefined;
        
        return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Захиалгын дэлгэрэнгүй</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors min-h-[40px] min-w-[40px]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Order ID */}
              <div>
                <label className="text-sm font-medium text-gray-500">Захиалгын ID</label>
                <p className="text-lg font-mono text-gray-900 mt-1">{selectedOrder.id}</p>
              </div>

              {/* Status */}
                <div>
                <label className="text-sm font-medium text-gray-500">Статус</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedOrder.status === "niitlegdsen" ? "bg-gray-100 text-gray-800" :
                    selectedOrder.status === "agent_sudlaj_bn" ? "bg-yellow-100 text-yellow-800" :
                    selectedOrder.status === "tolbor_huleej_bn" ? "bg-blue-100 text-blue-800" :
                    selectedOrder.status === "amjilttai_zahialga" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {selectedOrder.status === "niitlegdsen" ? "Нийтэлсэн" :
                     selectedOrder.status === "agent_sudlaj_bn" ? "Agent шалгаж байна" :
                     selectedOrder.status === "tolbor_huleej_bn" ? "Төлбөр хүлээж байна" :
                     selectedOrder.status === "amjilttai_zahialga" ? "Амжилттай захиалга" :
                     "Цуцлагдсан захиалга"}
                  </span>
                </div>
              </div>

              {/* User Info Section - Collapsible */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <button
                  onClick={() => setShowUserInfoInModal(!showUserInfoInModal)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Хэрэглэгчийн мэдээлэл</h3>
                  <svg 
                    className={`w-5 h-5 transition-transform ${showUserInfoInModal ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserInfoInModal && (
                  <div className="mt-4 space-y-4">
                    {/* User Profile Information */}
                    {selectedOrder.user?.profile && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Хэрэглэгчийн мэдээлэл (Каргод оруулах)</h4>
                        
                        {/* User Name */}
                        <div>
                          <label className="text-xs font-medium text-gray-600">Нэр:</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {selectedOrder.user.profile.name || "Байхгүй"}
                          </p>
                        </div>
                        
                        {/* User Phone */}
                        <div>
                          <label className="text-xs font-medium text-gray-600">Утас:</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {selectedOrder.user.profile.phone || "Байхгүй"}
                          </p>
                        </div>
                        
                        {/* User Cargo */}
                        <div>
                          <label className="text-xs font-medium text-gray-600">Сонгосон карго:</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {selectedOrder.user.profile.cargo || "Байхгүй"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {(selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0) && (
                <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Зургууд</label>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedOrder.imageUrls.map((imgUrl, index) => (
                            <img
                              key={index}
                              src={imgUrl}
                              alt={`${selectedOrder.productName} - ${index + 1}`}
                              className="w-full h-32 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setZoomedImageIndex(zoomedImageIndex === index ? null : index)}
                            />
                          ))}
                        </div>
                        {zoomedImageIndex !== null && (
                          <div
                            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
                            onClick={() => setZoomedImageIndex(null)}
                          >
                            <img
                              src={selectedOrder.imageUrls[zoomedImageIndex]}
                              alt={`${selectedOrder.productName} - ${zoomedImageIndex + 1}`}
                              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomedImageIndex(null);
                              }}
                            />
                            <button
                              onClick={() => setZoomedImageIndex(null)}
                              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                </div>
                    )}

                    {/* Product Name */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Барааны нэр</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">{selectedOrder.productName}</p>
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Тайлбар</label>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedOrder.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Show Agent Report if exists - Collapsible Box */}
              {/* Show for orders in "Миний захиалгууд" section (agent's own orders) */}
              {(() => {
                // Check if this order is in "myOrders" (agent's own orders)
                const isMyOrder = myOrders.some(order => order.id === selectedOrder.id);
                // Also check if order has agentId matching current user
                const isMyAssignedOrder = selectedOrder.agentId && selectedOrder.agentId === user?.id;
                return isMyOrder || isMyAssignedOrder;
              })() && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <button
                    onClick={() => {
                      setShowAgentReportInModal(!showAgentReportInModal);
                      // Load report if not loaded yet
                      if (!showAgentReportInModal && agentReports[selectedOrder.id] === undefined) {
                        loadAgentReport(selectedOrder.id);
                      }
                    }}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Миний илгээсэн тайлан</h3>
                    <svg 
                      className={`w-5 h-5 transition-transform ${showAgentReportInModal ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showAgentReportInModal && (
                    <div className="mt-4 space-y-4">
                      {agentReports[selectedOrder.id] === undefined && (
                        <div className="text-sm text-gray-500 text-center py-4">Ачааллаж байна...</div>
                      )}
                      
                      {agentReports[selectedOrder.id] === null && (
                        <div className="text-sm text-gray-500 text-center py-4">Тайлан байхгүй байна</div>
                      )}
                      
                      {agentReports[selectedOrder.id] && (() => {
                        const report = agentReports[selectedOrder.id];
                        if (!report) return null;
                        
                        return (
                          <>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Хэрэглэгчийн төлөх дүн:</label>
                              <p className="text-lg font-semibold text-green-600 mt-1">
                                {(() => {
                                  const exchangeRate = adminSettings?.exchangeRate || 1;
                                  const calculatedAmount = calculateUserPaymentAmount(report, exchangeRate);
                                  return calculatedAmount.toLocaleString();
                                })()} ₮
                              </p>
                            </div>

                            {report.paymentLink && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Төлбөрийн холбоос:</label>
                                <a 
                                  href={report.paymentLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 hover:underline break-all block mt-1"
                                >
                                  {report.paymentLink}
                                </a>
                              </div>
                            )}

                            {report.quantity && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Тоо ширхэг:</label>
                                <p className="text-gray-900 mt-1">{report.quantity}</p>
                              </div>
                            )}

                            {report.additionalDescription && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Нэмэлт тайлбар:</label>
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{report.additionalDescription}</p>
                              </div>
                            )}

                            {report.additionalImages && report.additionalImages.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-600 mb-2 block">Нэмэлт зураг:</label>
                                <div className="grid grid-cols-3 gap-3">
                                  {report.additionalImages.map((imgUrl, idx) => (
                                    <img
                                      key={idx}
                                      src={imgUrl}
                                      alt={`Additional ${idx + 1}`}
                                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Үүсгэсэн огноо</label>
                  <p className="text-gray-700 mt-1">
                    {new Date(selectedOrder.createdAt).toLocaleDateString("mn-MN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Шинэчлэгдсэн огноо</label>
                  <p className="text-gray-700 mt-1">
                    {new Date(selectedOrder.updatedAt).toLocaleDateString("mn-MN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
                    
              {/* Track Code Section - Show for successful orders */}
              {selectedOrder.status === "amjilttai_zahialga" && (selectedOrder.agentId === user?.id || user?.role === "admin") && (
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
                          style={{ fontSize: '16px' }}
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
                                const updatedOrder = await apiClient.updateTrackCode(selectedOrder.id, trackCodeInput.trim());
                                setSelectedOrder(updatedOrder);
                                setIsEditingTrackCode(false);
                                setTrackCodeInput("");
                                
                                // Reload orders to update the list
                                await loadData();
                                
                                alert("Track code амжилттай нэмэгдлээ");
                              } catch (err: any) {
                                alert(err.message || "Алдаа гарлаа");
                              } finally {
                                setTrackCodeLoading(false);
                              }
                            }}
                            disabled={trackCodeLoading}
                            className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 min-h-[44px]"
                          >
                            {trackCodeLoading ? "Хадгалж байна..." : "Хадгалах"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingTrackCode(false);
                              setTrackCodeInput("");
                            }}
                            disabled={trackCodeLoading}
                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium disabled:opacity-50 min-h-[44px]"
                          >
                            Цуцлах
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        {selectedOrder.trackCode ? (
                          <p className="text-gray-900 font-mono">{selectedOrder.trackCode}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">Track code байхгүй байна</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Button - Show for active and completed orders */}
              {(selectedOrder.status === "agent_sudlaj_bn" || selectedOrder.status === "tolbor_huleej_bn" || selectedOrder.status === "amjilttai_zahialga") && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setChatOrder(selectedOrder);
                      setShowChatModal(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mb-2 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Чат нээх
                  </button>
                </div>
              )}

              {/* Status Update Actions (for agents) */}
              {selectedOrder.status === "niitlegdsen" && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "agent_sudlaj_bn")}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium mb-2"
                  >
                    Захиалга шалгаж эхлэх
                  </button>
                </div>
              )}

              {selectedOrder.status === "agent_sudlaj_bn" && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setReportOrder(selectedOrder);
                      setShowReportForm(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mb-2"
                  >
                    Тайлан илгээх (Төлбөр хүлээж байна)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Chat Modal */}
      {showChatModal && chatOrder && (
        <ChatModal
          order={chatOrder}
          isOpen={showChatModal}
          onClose={() => { setChatOrder(null); setShowChatModal(false); }}
        />
      )}

      {/* Agent Report Form Modal */}
      {showReportForm && reportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Тайлан илгээх</h2>
              <button
                onClick={() => { setReportOrder(null); setShowReportForm(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors min-h-[40px] min-w-[40px]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <AgentReportForm
                order={reportOrder}
                onSuccess={async () => {
                  setReportOrder(null);
                  setShowReportForm(false);
                  await loadData();
                  alert("Тайлан амжилттай илгээгдлээ");
                }}
                onCancel={() => {
                  setReportOrder(null);
                  setShowReportForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
