"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { type User, type Profile, type Order, type OrderData, type AgentReport } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import ProfileForm from "@/components/ProfileForm";
import ChatModal from "@/components/ChatModal";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showProfileSection, setShowProfileSection] = useState(false);
  const [showOrderSection, setShowOrderSection] = useState(false);
  const [showNewOrderSection, setShowNewOrderSection] = useState(true);
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "completed" | "cancelled">("completed"); // Default: Амжилттай захиалга
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [agentReports, setAgentReports] = useState<Record<string, AgentReport | null>>({});
  const [expandedReportOrderId, setExpandedReportOrderId] = useState<string | null>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState<Record<string, boolean>>({});
  const [paymentInfo, setPaymentInfo] = useState<Record<string, { accountNumber?: string; accountName?: string; bank?: string; exchangeRate?: number }>>({});
  const [adminSettings, setAdminSettings] = useState<{ accountNumber?: string; accountName?: string; bank?: string; exchangeRate?: number } | null>(null);
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(false);
  
  // Notification states
  const [hasOrderUpdates, setHasOrderUpdates] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'order_update' | 'message' | 'track_code';
    title: string;
    message: string;
    orderId?: string;
    createdAt: Date;
  }>>([]);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationDropdown]);
  
  // Demo: Check for notifications (can be replaced with real API calls)
  useEffect(() => {
    if (orders.length > 0) {
      // Check for new messages/track codes (demo - replace with real check)
      setHasNewMessages(true); // Demo: always show for testing
    }
  }, [orders]);
  
  // New order form state - support multiple products
  const [newOrders, setNewOrders] = useState<Array<OrderData & { id: number }>>([
    { id: Date.now(), productName: "", description: "", imageUrls: [] },
  ]);
  const [newOrderImagePreviews, setNewOrderImagePreviews] = useState<string[][]>([[]]);
  const [newOrderLoading, setNewOrderLoading] = useState(false);
  const [newOrderError, setNewOrderError] = useState("");
  const [newOrderSuccess, setNewOrderSuccess] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set([Date.now()])); // Track which products are expanded

  // Auto-open profile section and form if profile is incomplete or doesn't exist
  useEffect(() => {
    if (!loading && user) {
      const isComplete = profile && profile.name && profile.phone && profile.cargo;
      if (!profile || !isComplete) {
        setShowProfileSection(true);
        setShowProfileForm(true);
      }
    }
  }, [profile, loading, user]);

  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/");
      return;
    }
    if (isLoaded && clerkUser) {
      loadData();
    }
  }, [isLoaded, clerkUser, router]);

  const loadAgentReport = async (orderId: string) => {
    try {
      const report = await apiClient.getAgentReport(orderId);
      setAgentReports(prev => ({ ...prev, [orderId]: report }));
    } catch (err) {
      // Silently fail - report might not exist yet
      setAgentReports(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const loadData = async () => {
    if (!clerkUser) return;
    
    try {
      // Get or create user in our database
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
        if (userData.profile) {
          setProfile(userData.profile);
        }
        
        // Load admin settings for payment info and exchange rate
        try {
          const settings = await apiClient.getAdminSettings();
          setAdminSettings(settings);
        } catch (err) {
          console.error("Failed to load admin settings:", err);
        }
        
        // Load orders
        try {
          const ordersData = await apiClient.getOrders();
          setOrders(ordersData);
          
          // If modal is open and we have a selectedOrder, update it from fresh data
          // Preserve userPaymentVerified state if it was set locally
          if (showOrderModal && selectedOrder) {
            const refreshedOrder = ordersData.find(o => o.id === selectedOrder.id);
            if (refreshedOrder) {
              // Preserve userPaymentVerified if it was set locally (from handlePaymentPaid)
              const preservedUserPaymentVerified = selectedOrder.userPaymentVerified || refreshedOrder.userPaymentVerified;
              setSelectedOrder({ ...refreshedOrder, userPaymentVerified: preservedUserPaymentVerified });
            }
          }
          
          // Load agent reports for orders that have agent assigned (including completed orders)
          ordersData.forEach(order => {
            if (order.agentId && (order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga")) {
              loadAgentReport(order.id);
            }
          });
          
          // Check for order updates (status changed, new track code, etc.)
          const hasUpdates = ordersData.some(order => {
            // Check if order status changed or has recent updates
            const orderDate = new Date(order.updatedAt);
            const now = new Date();
            const hoursSinceUpdate = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
            // Show notification if updated in last 24 hours and status is not agent_sudlaj_bn
            return hoursSinceUpdate < 24 && order.status !== 'agent_sudlaj_bn';
          });
          setHasOrderUpdates(hasUpdates);

          // Generate notifications from orders
          const generatedNotifications: Array<{
            id: string;
            type: 'order_update' | 'message' | 'track_code';
            title: string;
            message: string;
            orderId?: string;
            createdAt: Date;
          }> = [];

          ordersData.forEach(order => {
            const orderDate = new Date(order.updatedAt);
            const now = new Date();
            const hoursSinceUpdate = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
            
            // Order status update notifications
            if (hoursSinceUpdate < 24 && order.status !== 'agent_sudlaj_bn') {
              const statusText = 
                order.status === 'tolbor_huleej_bn' ? 'Төлбөр хүлээж байна' :
                order.status === 'amjilttai_zahialga' ? 'Амжилттай захиалга' :
                order.status === 'tsutsalsan_zahialga' ? 'Цуцлагдсан захиалга' : '';
              
              generatedNotifications.push({
                id: `order-${order.id}-${order.status}`,
                type: 'order_update',
                title: 'Захиалга өөрчлөгдсөн',
                message: `${order.productName} захиалгын статус: ${statusText}`,
                orderId: order.id,
                createdAt: new Date(order.updatedAt),
              });
            }
          });

          // Demo: Add message notifications
          if (hasNewMessages) {
            generatedNotifications.push({
              id: 'message-1',
              type: 'message',
              title: 'Шинэ мессеж',
              message: 'Таны захиалгатай холбоотой шинэ мессеж ирсэн байна.',
              createdAt: new Date(),
            });
            generatedNotifications.push({
              id: 'track-1',
              type: 'track_code',
              title: 'Трак код',
              message: 'Таны захиалганд шинэ трак код нэмэгдлээ.',
              createdAt: new Date(),
            });
          }

          setNotifications(generatedNotifications);
          setNotificationCount(generatedNotifications.length);
        } catch (err) {
          // Orders might not exist yet, that's okay
        }
      } catch (err: any) {
        // If user doesn't exist, the backend will create it automatically via Clerk middleware
        // Just retry after a moment
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);
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

  const handleProfileSuccess = async () => {
    await loadData();
    setShowProfileForm(false);
  };

  const handleOrderSuccess = async () => {
    await loadData();
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Та энэ захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      await apiClient.cancelOrder(orderId);
      await loadData();
      setShowOrderModal(false);
      alert("Захиалга амжилттай цуцлагдлаа");
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
    }
  };

  const canCancelOrder = (order: Order) => {
    // Зөвхөн "нийтэлсэн" эсвэл "цуцлагдсан" статустай захиалгыг цуцлах боломжтой
    // Хэрэв agent шалгаж эхэлсэн бол (agent_sudlaj_bn, tolbor_huleej_bn, amjilttai_zahialga) цуцлах боломжгүй
    return order.status === "niitlegdsen" || order.status === "tsutsalsan_zahialga";
  };

  const handleRepublishOrder = async (orderId: string) => {
    if (!confirm("Та энэ захиалгыг дахин нийтлэхдээ итгэлтэй байна уу? Захиалга цуцлагдаж шинээр үүсгэгдэнэ.")) {
      return;
    }

    try {
      // First cancel the order
      await apiClient.cancelOrder(orderId);
      
      // Get the order details
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error("Захиалга олдсонгүй");
      }

      // Create new order with same data
      await apiClient.createOrder({
        productName: order.productName,
        description: order.description,
        imageUrls: order.imageUrls || [],
      });

      await loadData();
      setShowOrderModal(false);
      alert("Захиалга амжилттай дахин нийтлэгдлээ");
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
    }
  };

  const handlePaymentPaid = async (orderId: string) => {
    if (!confirm("Та төлбөр төлсөн эсэхийг баталгаажуулахдаа итгэлтэй байна уу? Admin-д хүсэлт илгээгдэнэ.")) {
      return;
    }

    try {
      // Call API to confirm user payment
      await apiClient.request<Order>(`/orders/${orderId}/user-payment-confirmed`, {
        method: "PUT",
      });
      
      alert("Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin баталгаажуулахад хүлээнэ үү.");
      
      // Update selectedOrder state immediately with the updated order from API response
      // Ensure userPaymentVerified is set to true
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ 
          ...selectedOrder, 
          userPaymentVerified: true 
        });
      }
      
      // Reload data to get updated orders list
      // Note: loadData will preserve userPaymentVerified if it was set
      await loadData();
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
    }
  };

  const loadPaymentInfo = async (orderId: string) => {
    try {
      // Load admin settings if not loaded
      if (!adminSettings) {
        const settings = await apiClient.getAdminSettings();
        setAdminSettings(settings);
        setPaymentInfo(prev => ({
          ...prev,
          [orderId]: {
            accountNumber: settings.accountNumber || "",
            accountName: settings.accountName || "",
            bank: settings.bank || "",
            exchangeRate: settings.exchangeRate || 1,
          }
        }));
      } else {
        setPaymentInfo(prev => ({
          ...prev,
          [orderId]: {
            accountNumber: adminSettings.accountNumber || "",
            accountName: adminSettings.accountName || "",
            bank: adminSettings.bank || "",
            exchangeRate: adminSettings.exchangeRate || 1,
          }
        }));
      }
    } catch (err: any) {
      console.error("Failed to load payment info:", err);
      // Fallback to placeholder
      setPaymentInfo(prev => ({
        ...prev,
        [orderId]: {
          accountNumber: "1234567890",
          accountName: "Agentbuy.mn",
          bank: "Хаан банк",
          exchangeRate: 1,
        }
      }));
    }
  };

  // Calculate user payment amount: agent report userAmount * exchangeRate * 1.05
  // Memoize this function to avoid recreating it on every render
  const calculateUserPaymentAmount = useCallback((agentReport: AgentReport | null, exchangeRate: number = 1): number => {
    if (!agentReport) return 0;
    return agentReport.userAmount * exchangeRate * 1.05;
  }, []);

  // Load agent report when order modal opens
  useEffect(() => {
    if (showOrderModal && selectedOrder && (selectedOrder.status === "agent_sudlaj_bn" || selectedOrder.status === "tolbor_huleej_bn" || selectedOrder.status === "amjilttai_zahialga")) {
      if (agentReports[selectedOrder.id] === undefined) {
        loadAgentReport(selectedOrder.id);
      }
    }
  }, [showOrderModal, selectedOrder?.id]);

  const handleNewOrderImageChange = (e: React.ChangeEvent<HTMLInputElement>, productIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newPreviews = [...newOrderImagePreviews];
    const currentImages = newPreviews[productIndex] || [];
    
    const remainingSlots = 3 - currentImages.length;
    if (remainingSlots <= 0) {
      alert("Дээд тал нь 3 зураг оруулах боломжтой");
      return;
    }
    
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const updatedPreviews = [...newOrderImagePreviews];
        if (!updatedPreviews[productIndex]) {
          updatedPreviews[productIndex] = [];
        }
        updatedPreviews[productIndex] = [...updatedPreviews[productIndex], dataUrl];
        setNewOrderImagePreviews(updatedPreviews);
        
        const newOrdersList = [...newOrders];
        if (!newOrdersList[productIndex].imageUrls) {
          newOrdersList[productIndex].imageUrls = [];
        }
        newOrdersList[productIndex].imageUrls = updatedPreviews[productIndex];
        setNewOrders(newOrdersList);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = "";
  };

  const removeNewOrderImage = (productIndex: number, imageIndex: number) => {
    const updatedPreviews = [...newOrderImagePreviews];
    updatedPreviews[productIndex] = updatedPreviews[productIndex].filter((_, i) => i !== imageIndex);
    setNewOrderImagePreviews(updatedPreviews);
    
    const newOrdersList = [...newOrders];
    newOrdersList[productIndex].imageUrls = updatedPreviews[productIndex];
    setNewOrders(newOrdersList);
  };

  const addNewProductField = () => {
    const newId = Date.now() + Math.random();
    setNewOrders([...newOrders, { id: newId, productName: "", description: "", imageUrls: [] }]);
    setNewOrderImagePreviews([...newOrderImagePreviews, []]);
    // Collapse first product when adding new one
    if (newOrders.length > 0) {
      const firstProductId = newOrders[0].id;
      setExpandedProducts(new Set([newId])); // Only expand the new product
    } else {
      setExpandedProducts(new Set([newId]));
    }
  };

  const toggleProductExpand = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const removeNewProductField = (id: number) => {
    if (newOrders.length > 1) {
      const index = newOrders.findIndex(o => o.id === id);
      setNewOrders(newOrders.filter((_, i) => i !== index));
      setNewOrderImagePreviews(newOrderImagePreviews.filter((_, i) => i !== index));
      // Remove from expanded set
      const newExpanded = new Set(expandedProducts);
      newExpanded.delete(id);
      setExpandedProducts(newExpanded);
    }
  };

  const handleNewOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewOrderLoading(true);
    setNewOrderError("");
    setNewOrderSuccess(false);

    try {
      // Validate that at least one order has required fields
      const validOrders = newOrders.filter(order => order.productName && order.description);
      if (validOrders.length === 0) {
        setNewOrderError("Хамгийн багадаа нэг барааны нэр болон тайлбар оруулах шаардлагатай");
        setNewOrderLoading(false);
        return;
      }

      // Create all orders
      const createdOrders: string[] = [];
      const errors: string[] = [];
      
      for (const order of validOrders) {
        try {
          const { id, ...orderData } = order;
          // Ensure imageUrls is an array (can be empty)
          if (!orderData.imageUrls) {
            orderData.imageUrls = [];
          }
          
          console.log(`[DEBUG] Creating order:`, {
            productName: orderData.productName,
            description: orderData.description?.substring(0, 50),
            imageUrlsCount: orderData.imageUrls?.length || 0,
          });
          
          await apiClient.createOrder(orderData);
          createdOrders.push(order.productName);
          console.log(`[DEBUG] Order created successfully: ${order.productName}`);
        } catch (orderErr: any) {
          console.error(`[DEBUG] Error creating order ${order.productName}:`, {
            message: orderErr.message,
            stack: orderErr.stack,
            response: orderErr.response,
          });
          // Continue creating other orders even if one fails
          errors.push(`${order.productName}: ${orderErr.message || "Алдаа"}`);
        }
      }

      if (createdOrders.length > 0) {
        setNewOrderSuccess(true);
        setNewOrders([{ id: Date.now(), productName: "", description: "", imageUrls: [] }]);
        setNewOrderImagePreviews([[]]);
        
        // Reload orders
        await loadData();
        
        // Show error message if some orders failed
        if (errors.length > 0) {
          setNewOrderError(`Зарим захиалга үүсгэхэд алдаа гарлаа: ${errors.join(", ")}`);
        }
        
        // Reset success message after 2 seconds
        setTimeout(() => {
          setNewOrderSuccess(false);
        }, 2000);
      } else {
        setNewOrderError(`Бүх захиалга үүсгэхэд алдаа гарлаа: ${errors.join(", ")}`);
      }
    } catch (err: any) {
      setNewOrderError(err.message || "Алдаа гарлаа");
    } finally {
      setNewOrderLoading(false);
    }
  };

  // Memoize profile completion check
  const isProfileComplete = useMemo(() => 
    profile && profile.name && profile.phone && profile.cargo,
    [profile]
  );

  // Memoize filtered orders to avoid recalculating on every render
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderFilter === "all") return true;
      if (orderFilter === "active") {
        // Идэвхтэй: niitlegdsen, agent_sudlaj_bn, tolbor_huleej_bn
        return order.status === "niitlegdsen" || order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn";
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
  }, [orders, orderFilter]);

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
    const cancelledOrders = orders.filter(order => order.status === "tsutsalsan_zahialga");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg text-gray-600">...</div>
      </div>
    );
  }

  if (!clerkUser) {
    return null;
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  const handleBecomeAgent = async () => {
    if (!confirm("Та agent болох хүсэлт илгээхдээ итгэлтэй байна уу? Admin-аар батлагдахад хүлээнэ үү.")) {
      return;
    }
    
    try {
      const updatedUser = await apiClient.registerAsAgent();
      setUser(updatedUser);
      alert("Agent бүртгэл амжилттай үүслээ! Admin-аар батлагдахад хүлээнэ үү.");
      // Reload data
      await loadData();
    } catch (err: any) {
      alert(err.message || "Agent бүртгэл үүсгэхэд алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Agent Registration Section - Show if user role */}
          {user?.role === "user" && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Agent болох</h3>
                  <p className="text-sm text-blue-800">
                    Та agent болох хүсэлт илгээж болно. Admin-аар батлагдсаны дараа захиалгуудыг харж, ажиллах боломжтой болно.
                  </p>
                </div>
                <button
                  onClick={handleBecomeAgent}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
                >
                  Agent болох
                </button>
              </div>
            </div>
          )}
          {/* Order Section - Only show if profile is complete */}
          {isProfileComplete ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Омнох захиалгууд */}
            

              {/* Box 2: Шинэ захиалга үүсгэх */}
              <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Шинэ захиалга үүсгэх</h2>
                  <button
                    onClick={() => setShowNewOrderSection(!showNewOrderSection)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg 
                      className={`w-5 h-5 transition-transform ${showNewOrderSection ? 'rotate-90' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
            </div>
                
                {showNewOrderSection && (
                <form onSubmit={handleNewOrderSubmit} className="space-y-6">
                  {newOrderError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {newOrderError}
                    </div>
                  )}
                  
                  {newOrderSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      Захиалга амжилттай үүслээ!
                    </div>
                  )}

                  {newOrders.map((order, index) => {
                    const isExpanded = expandedProducts.has(order.id);
                    return (
                    <div key={order.id} className="border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div 
                        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => toggleProductExpand(order.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg 
                            className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {index === 0 ? "Бараа #1" : `Бараа #${index + 1}`}
                            {order.productName && ` - ${order.productName}`}
                          </h3>
                        </div>
                        {newOrders.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNewProductField(order.id);
                            }}
                            className="px-2 py-1 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center gap-1 flex-shrink-0"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Устгах
                </button>
                        )}
            </div>

                      {isExpanded && (
                      <div className="p-4 space-y-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Зураг (Дээд тал нь 3 зураг)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleNewOrderImageChange(e, index)}
                          disabled={newOrderImagePreviews[index]?.length >= 3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        />
                        {newOrderImagePreviews[index] && newOrderImagePreviews[index].length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {newOrderImagePreviews[index].map((preview, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}-${imgIndex + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewOrderImage(index, imgIndex)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                  title="Устгах"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
          </div>
                            ))}
        </div>
                        )}
                        {newOrderImagePreviews[index]?.length >= 3 && (
                          <p className="mt-2 text-xs text-gray-500">Дээд тал нь 3 зураг оруулах боломжтой</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Барааны нэр
                        </label>
                        <input
                          type="text"
                          required
                          value={order.productName}
                          onChange={(e) => {
                            const updatedOrders = [...newOrders];
                            updatedOrders[index].productName = e.target.value;
                            setNewOrders(updatedOrders);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                          placeholder="Барааны нэр оруулах"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Тайлбар
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={order.description}
                          onChange={(e) => {
                            const updatedOrders = [...newOrders];
                            updatedOrders[index].description = e.target.value;
                            setNewOrders(updatedOrders);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                          placeholder="Барааны дэлгэрэнгүй тайлбар оруулах..."
                        />
                      </div>
                      </div>
                      )}
                    </div>
                    );
                  })}

              <button
                    type="button"
                    onClick={addNewProductField}
                    className="w-full px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium text-sm"
              >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Бараа нэмэх
              </button>

                  <button
                    type="submit"
                    disabled={newOrderLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium text-sm"
                  >
                    {newOrderLoading ? "Хадгалж байна..." : "Захиалга үүсгэх"}
                  </button>
                </form>
                )}
            </div>
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Өмнөх захиалгууд</h2>
                  <div className="flex items-center gap-2">
                    {/* Notification dropdown */}
                    {(hasOrderUpdates || hasNewMessages || notificationCount > 0) && (
                      <div className="relative" ref={notificationDropdownRef}>
                        <button
                          onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition relative"
                          title="Мэдэгдлүүд"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {notificationCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {notificationCount > 9 ? '9+' : notificationCount}
                            </div>
                          )}
                        </button>
                        
                        {showNotificationDropdown && (
                          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-96 overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                              <h3 className="text-lg font-bold text-gray-900">Мэдэгдлүүд</h3>
                              <button
                                onClick={() => setShowNotificationDropdown(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                  <div
                                    key={notification.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                                    onClick={() => {
                                      if (notification.orderId) {
                                        const order = orders.find(o => o.id === notification.orderId);
                                        if (order) {
                                          setSelectedOrder(order);
                                          setShowOrderModal(true);
                                          setShowNotificationDropdown(false);
                                        }
                                      }
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                        notification.type === 'order_update' ? 'bg-yellow-500' :
                                        notification.type === 'message' ? 'bg-blue-500' :
                                        'bg-green-500'
                                      }`}></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {new Date(notification.createdAt).toLocaleDateString("mn-MN", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-sm text-gray-500">
                                  Мэдэгдэл байхгүй байна.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setShowOrderSection(!showOrderSection)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform ${showOrderSection ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {showOrderSection && (
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
                    {orderFilter === "cancelled" && filteredOrders.length > 0 && (
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={handleClearAllCancelledOrders}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          Бүгдийг устгах (Clear All)
                        </button>
                      </div>
                    )}

                    {/* Filtered orders */}
                    <div className="max-h-96 overflow-y-auto">
                      {filteredOrders.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {filteredOrders.map((order) => {
                              const mainImage = (order.imageUrls && order.imageUrls.length > 0) 
                                ? order.imageUrls[0] 
                                : order.imageUrl || null;
                              
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
                                  case "niitlegdsen": return "Нийтэлсэн";
                                  case "agent_sudlaj_bn": return "Agent шалгаж байна";
                                  case "tolbor_huleej_bn": return "Төлбөр хүлээж байна";
                                  case "amjilttai_zahialga": return "Амжилттай захиалга";
                                  case "tsutsalsan_zahialga": return "Цуцлагдсан захиалга";
                                  default: return status;
                                }
                              };

                              return (
                                <div 
                                  key={order.id} 
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer"
                                >
                                  {/* Thumbnail Image */}
                                  {mainImage && (
                                    <div className="w-full h-40 bg-gray-200 overflow-hidden">
                                      <img
                                        src={mainImage}
                                        alt={order.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Card Content */}
                                  <div className="p-4 space-y-3">
                                    {/* Order ID */}
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-mono text-gray-500">ID: {order.id.slice(0, 8)}...</p>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                      </span>
                                    </div>

                                    {/* Payment Verified Notice - Show if user has confirmed payment */}
                                    {order.userPaymentVerified && order.status === "tolbor_huleej_bn" && (
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                        <p className="text-xs text-yellow-800 font-medium text-center">
                                          Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin баталгаажуулахад хүлээнэ үү.
                                        </p>
                                      </div>
                                    )}

                                    {/* Product Name - Collapsed if agent report exists */}
                                    {agentReports[order.id] && expandedReportOrderId !== order.id ? (
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 text-lg line-clamp-1 opacity-50">
                                          {order.productName}
                                        </h4>
                                        <p className="text-sm text-gray-600 line-clamp-1 opacity-50">
                                          {order.description}
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        <h4 className="font-bold text-gray-900 text-lg line-clamp-1">
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
                                            {order.status === "amjilttai_zahialga" ? "Төлсөн дүн:" : "Төлөх дүн:"}
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

                                    {/* Track Code - Show for successful orders */}
                                    {order.status === "amjilttai_zahialga" && order.trackCode && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-medium text-gray-700">Track Code:</span>
                                          <div className="flex items-center gap-2">
                                            <span 
                                              className="text-sm font-mono text-blue-600 font-semibold cursor-pointer hover:text-blue-800 transition"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(order.trackCode || "");
                                                alert("Track code хуулагдлаа!");
                                              }}
                                              title="Хуулах"
                                            >
                                              {order.trackCode}
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(order.trackCode || "");
                                                alert("Track code хуулагдлаа!");
                                              }}
                                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                                              title="Хуулах"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                              </svg>
                                            </button>
                                          </div>
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
                                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                        >
                                          Устгах (Clear)
                                        </button>
                                      </div>
                                    )}

                                    {/* Date */}
                                    <div className="pt-2 border-t border-gray-200">
                                      <p className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric"
                                        })}
                                      </p>
                                    </div>

                                    {/* Chat Button - Show for active and completed orders with agent */}
                                    {(order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga") && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setChatOrder(order);
                                            setShowChatModal(true);
                                          }}
                                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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
                                          <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2 text-xs">
                <div>
                                              <span className="font-medium text-gray-700">Хэрэглэгчийн төлөх дүн:</span>
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
                                                <span className="font-medium text-gray-700">Төлбөрийн холбоос:</span>
                                                <a 
                                                  href={agentReports[order.id]?.paymentLink} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="ml-2 text-blue-600 hover:underline break-all"
                                                >
                                                  {agentReports[order.id]?.paymentLink}
                                                </a>
                                              </div>
                                            )}
                                            {agentReports[order.id]?.quantity && (
                                              <div>
                                                <span className="font-medium text-gray-700">Тоо ширхэг:</span>
                                                <span className="ml-2 text-gray-900">{agentReports[order.id]?.quantity}</span>
                                              </div>
                                            )}
                                            {agentReports[order.id]?.additionalDescription && (
                                              <div>
                                                <span className="font-medium text-gray-700">Нэмэлт тайлбар:</span>
                                                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{agentReports[order.id]?.additionalDescription}</p>
                                              </div>
                                            )}
                                            {agentReports[order.id]?.additionalImages && agentReports[order.id]!.additionalImages.length > 0 && (
                                              <div>
                                                <span className="font-medium text-gray-700">Нэмэлт зураг:</span>
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
                          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                            <p>
                              {orderFilter === "all" && "Өмнөх захиалга байхгүй байна."}
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
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Захиалга үүсгэхийн тулд эхлээд профайлаа бүрэн бөглөнө үү (Нэр, Утас, Ачаа).
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (() => {
        const currentReport = agentReports[selectedOrder.id];
        const hasAgentReport = currentReport !== null && currentReport !== undefined;
        
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Захиалгын дэлгэрэнгүй</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <button
                  onClick={() => setShowUserInfoInModal(!showUserInfoInModal)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-bold text-gray-900">Хэрэглэгчийн мэдээлэл</h3>
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
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
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
                      <p className="text-lg font-semibold text-gray-900 mt-1">{selectedOrder.productName}</p>
                </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Тайлбар</label>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{selectedOrder.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Show Agent Report if exists */}
              {hasAgentReport && currentReport ? (
                <>
                  {/* Agent Report Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Agent-ийн тайлан</h3>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Хэрэглэгчийн төлөх дүн:</label>
                      <p className="text-xl font-bold text-green-600 mt-1">
                        {(() => {
                          const exchangeRate = adminSettings?.exchangeRate || paymentInfo[selectedOrder.id]?.exchangeRate || 1;
                          const calculatedAmount = calculateUserPaymentAmount(currentReport, exchangeRate);
                          return calculatedAmount.toLocaleString();
                        })()} ₮
                      </p>
                    </div>
                    
                    {currentReport.paymentLink && (
                    <div>
                        <label className="text-sm font-medium text-gray-700">Төлбөрийн холбоос:</label>
                        <a 
                          href={currentReport.paymentLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all block mt-1"
                        >
                          {currentReport.paymentLink}
                        </a>
                    </div>
                    )}

                    {currentReport.quantity && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Тоо ширхэг:</label>
                        <p className="text-gray-900 mt-1">{currentReport.quantity}</p>
                      </div>
                    )}

                    {currentReport.additionalDescription && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Нэмэлт тайлбар:</label>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{currentReport.additionalDescription}</p>
                      </div>
                    )}

                    {currentReport.additionalImages && currentReport.additionalImages.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Нэмэлт зураг:</label>
                        <div className="grid grid-cols-3 gap-3">
                          {currentReport.additionalImages.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`Additional ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for orders with agent report */}
                  {selectedOrder.status === "tolbor_huleej_bn" && (
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      {/* If payment is verified, show only admin account info */}
                      {selectedOrder.userPaymentVerified ? (
                        <>
                          {/* Show waiting message - always show for tolbor_huleej_bn status */}
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800 font-medium">
                              Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin баталгаажуулахад хүлээнэ үү.
                            </p>
                          </div>
                          
                          {/* Admin Account Info Display - Always show if payment verified */}
                          {(() => {
                            // Load payment info if not loaded yet
                            if (!paymentInfo[selectedOrder.id] && adminSettings) {
                              // Use adminSettings if available
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Дансны дугаар:</label>
                                    <p className="text-gray-900 font-mono">{adminSettings.accountNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Дансны нэр:</label>
                                    <p className="text-gray-900">{adminSettings.accountName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Банк:</label>
                                    <p className="text-gray-900">{adminSettings.bank}</p>
                                  </div>
                                </div>
                              );
                            } else if (paymentInfo[selectedOrder.id]) {
                              // Use paymentInfo if available
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Дансны дугаар:</label>
                                    <p className="text-gray-900 font-mono">{paymentInfo[selectedOrder.id]?.accountNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Дансны нэр:</label>
                                    <p className="text-gray-900">{paymentInfo[selectedOrder.id]?.accountName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Банк:</label>
                                    <p className="text-gray-900">{paymentInfo[selectedOrder.id]?.bank}</p>
                                  </div>
                                </div>
                              );
                            } else {
                              // Load payment info if not available
                              if (!showPaymentInfo[selectedOrder.id]) {
                                loadPaymentInfo(selectedOrder.id);
                              }
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <p className="text-sm text-gray-500 text-center">Ачааллаж байна...</p>
                                </div>
                              );
                            }
                          })()}
                  </>
                ) : (
                        <>
                          {/* Payment Info Button - Only show if payment not verified */}
                          <button
                            onClick={() => {
                              if (!showPaymentInfo[selectedOrder.id]) {
                                loadPaymentInfo(selectedOrder.id);
                              }
                              setShowPaymentInfo(prev => ({ ...prev, [selectedOrder.id]: !prev[selectedOrder.id] }));
                            }}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                          >
                            Төлбөр төлөх
                          </button>

                          {/* Payment Info Display */}
                          {showPaymentInfo[selectedOrder.id] && paymentInfo[selectedOrder.id] && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Дансны дугаар:</label>
                                <p className="text-gray-900 font-mono">{paymentInfo[selectedOrder.id]?.accountNumber}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Дансны нэр:</label>
                                <p className="text-gray-900">{paymentInfo[selectedOrder.id]?.accountName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Банк:</label>
                                <p className="text-gray-900">{paymentInfo[selectedOrder.id]?.bank}</p>
                              </div>
                              <button
                                onClick={() => handlePaymentPaid(selectedOrder.id)}
                                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                              >
                                Төлбөр төлсөн
                              </button>
                  </div>
                          )}

                          {/* Cancel and Republish Buttons - Only show if payment not verified */}
                          <button
                            onClick={() => handleCancelOrder(selectedOrder.id)}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                          >
                            Цуцлах
                          </button>

                          <button
                            onClick={() => handleRepublishOrder(selectedOrder.id)}
                            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                          >
                            Дахин нийтлэх
                          </button>
                        </>
                )}
              </div>
            )}
                </>
              ) : null}
                
              {/* Track Code - Show for successful orders */}
              {selectedOrder.status === "amjilttai_zahialga" && selectedOrder.trackCode && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Track Code</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.trackCode || "");
                          alert("Track code хуулагдлаа!");
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
                        title="Хуулах"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium">Хуулах</span>
                      </button>
          </div>
                    <p 
                      className="text-lg font-mono text-blue-600 font-semibold cursor-pointer hover:text-blue-800 transition"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.trackCode || "");
                        alert("Track code хуулагдлаа!");
                      }}
                      title="Хуулах"
                    >
                      {selectedOrder.trackCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Таны захиалгын track code. Энэ кодыг ашиглан захиалгаа хянах боломжтой.</p>
        </div>
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
                    
              {/* Chat Button - Show for active and completed orders with agent */}
              {selectedOrder.agentId && (selectedOrder.status === "agent_sudlaj_bn" || selectedOrder.status === "tolbor_huleej_bn" || selectedOrder.status === "amjilttai_zahialga") && (
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

              {/* Cancel Button - Only for cancellable orders */}
              {canCancelOrder(selectedOrder) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Захиалга цуцлах / Устгах
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
    </div>
  );
}

