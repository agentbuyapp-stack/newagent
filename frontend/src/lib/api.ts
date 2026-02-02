const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type Role = "user" | "agent" | "admin";

export interface User {
  id: string;
  email: string;
  role: Role;
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  agentPoints?: number;
  researchCards?: number;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  cargo?: string;
  accountNumber?: string; // For agents
  emailNotificationsEnabled?: boolean; // Email мэдэгдэл on/off
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  role?: Role;
}

export interface ProfileData {
  name: string;
  phone: string;
  email: string;
  cargo?: string;
  accountNumber?: string; // For agents
  emailNotificationsEnabled?: boolean; // Email мэдэгдэл on/off
}

export type OrderStatus = "niitlegdsen" | "agent_sudlaj_bn" | "tolbor_huleej_bn" | "amjilttai_zahialga" | "tsutsalsan_zahialga";

export interface Order {
  id: string;
  userId: string;
  agentId?: string; // Agent who is handling this order
  productName: string;
  description: string;
  imageUrl?: string; // Keep for backward compatibility
  imageUrls?: string[]; // Array of image URLs
  status: OrderStatus;
  userPaymentVerified?: boolean;
  agentPaymentPaid?: boolean;
  trackCode?: string; // Track code for successful orders
  cancelReason?: string; // Reason for cancellation
  archivedByUser?: boolean; // User archived this order
  archivedByAgent?: boolean; // Agent archived this order
  createdAt: string;
  updatedAt: string;
  user?: User;
  agent?: User; // Agent user with profile
}

export interface OrderData {
  productName?: string;
  description?: string;
  imageUrl?: string; // Keep for backward compatibility
  imageUrls?: string[]; // Array of image URLs (max 3)
  products?: Array<{
    productName: string;
    description: string;
    imageUrls?: string[];
  }>; // Multiple products in one order
}

class ApiClient {
  private baseUrl: string;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the function to get Clerk session token
   * Call this with useAuth().getToken from Clerk
   */
  setTokenGetter(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Get Clerk session token if available
    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else if (process.env.NEXT_PUBLIC_DISABLE_CLERK_AUTH === "true") {
        // Development mode: Skip authentication header
        console.warn("⚠️  Development mode: Clerk authentication disabled");
      }
    } else if (process.env.NEXT_PUBLIC_DISABLE_CLERK_AUTH === "true") {
      // Development mode: Skip authentication header
      console.warn("⚠️  Development mode: Clerk authentication disabled");
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }

        // Log error for debugging
        console.error(`API Error [${response.status}]:`, {
          endpoint,
          url,
          error: errorData.error || errorData.message,
          details: errorData,
        });

        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error: unknown) {
      // Enhanced error logging
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("API Request failed:", {
        endpoint,
        url,
        error: errorMessage,
        stack: errorStack,
      });
      throw error;
    }
  }

  // Auth endpoints
  // Note: With Clerk, registration is handled by Clerk. This endpoint is kept for backward compatibility.
  async register(data: RegisterData): Promise<User> {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // User endpoints
  async getMe(): Promise<User> {
    return this.request<User>("/me");
  }

  // Profile endpoints
  async getProfile(): Promise<Profile> {
    return this.request<Profile>("/profile");
  }

  async updateProfile(data: ProfileData): Promise<Profile> {
    return this.request<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Order endpoints
  async createOrder(data: OrderData): Promise<Order> {
    return this.request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>("/orders");
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`);
  }

  async cancelOrder(orderId: string): Promise<void> {
    return this.request<void>(`/orders/${orderId}`, {
      method: "DELETE",
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, cancelReason }),
    });
  }

  // Update track code for order (agent/admin only)
  async updateTrackCode(orderId: string, trackCode: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/track-code`, {
      method: "PUT",
      body: JSON.stringify({ trackCode }),
    });
  }

  // Archive order (user or agent)
  async archiveOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/archive`, {
      method: "PUT",
    });
  }

  // Agent endpoints
  async registerAsAgent(): Promise<User> {
    return this.request<User>("/agents/register", {
      method: "POST",
    });
  }

  // Admin endpoints
  async addAgent(email: string): Promise<User> {
    return this.request<User>("/admin/agents", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getAgents(): Promise<User[]> {
    return this.request<User[]>("/admin/agents");
  }

  async approveAgent(agentId: string, approved: boolean): Promise<User> {
    return this.request<User>(`/admin/agents/${agentId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approved }),
    });
  }

  async getCargos(): Promise<Cargo[]> {
    // Use public endpoint for users/agents to select cargo
    return this.request<Cargo[]>("/cargos");
  }

  async getPublicAgents(): Promise<PublicAgent[]> {
    // Public endpoint - get approved agents with stats
    return this.request<PublicAgent[]>("/agents/public");
  }

  async getTopAgents(): Promise<PublicAgent[]> {
    // Public endpoint - get top 10 agents
    return this.request<PublicAgent[]>("/agents/top");
  }

  async getAgentSpecialties(): Promise<AgentSpecialty[]> {
    // Public endpoint - get available specialties
    return this.request<AgentSpecialty[]>("/agents/specialties");
  }

  async getAgentReviews(agentId: string): Promise<AgentReview[]> {
    // Public endpoint - get agent reviews
    return this.request<AgentReview[]>(`/agents/${agentId}/reviews`);
  }

  async createAgentReview(agentId: string, orderId: string, rating: number, comment?: string): Promise<AgentReview> {
    // Create review for agent (user only)
    return this.request<AgentReview>(`/agents/${agentId}/reviews/${orderId}`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Admin: Agent Profile Management
  async updateAgentProfile(agentId: string, data: AgentProfileData): Promise<User> {
    return this.request<User>(`/admin/agents/${agentId}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateAgentRank(agentId: string, rank: number): Promise<{ id: string; rank: number; isTopAgent: boolean }> {
    return this.request<{ id: string; rank: number; isTopAgent: boolean }>(`/admin/agents/${agentId}/rank`, {
      method: "PUT",
      body: JSON.stringify({ rank }),
    });
  }

  async toggleAgentTop(agentId: string, isTop: boolean): Promise<{ id: string; isTopAgent: boolean; rank: number }> {
    return this.request<{ id: string; isTopAgent: boolean; rank: number }>(`/admin/agents/${agentId}/toggle-top`, {
      method: "PUT",
      body: JSON.stringify({ isTop }),
    });
  }

  async reorderAgents(agentIds: string[]): Promise<Array<{ id: string; rank: number; isTopAgent: boolean }>> {
    return this.request<Array<{ id: string; rank: number; isTopAgent: boolean }>>("/admin/agents/reorder", {
      method: "POST",
      body: JSON.stringify({ agentIds }),
    });
  }

  // Admin: Specialties Management
  async getAdminSpecialties(): Promise<AgentSpecialty[]> {
    return this.request<AgentSpecialty[]>("/admin/specialties");
  }

  async createSpecialty(data: { name: string; nameEn?: string; icon?: string; description?: string }): Promise<AgentSpecialty> {
    return this.request<AgentSpecialty>("/admin/specialties", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSpecialty(specialtyId: string, data: { name?: string; nameEn?: string; icon?: string; description?: string; isActive?: boolean; order?: number }): Promise<AgentSpecialty> {
    return this.request<AgentSpecialty>(`/admin/specialties/${specialtyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSpecialty(specialtyId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/specialties/${specialtyId}`, {
      method: "DELETE",
    });
  }

  // Admin: Reviews Management
  async getAdminReviews(): Promise<AgentReview[]> {
    return this.request<AgentReview[]>("/admin/reviews");
  }

  async approveAgentReview(reviewId: string, approved: boolean): Promise<AgentReview> {
    return this.request<AgentReview>(`/admin/reviews/${reviewId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approved }),
    });
  }

  async deleteAgentReview(reviewId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/reviews/${reviewId}`, {
      method: "DELETE",
    });
  }

  async createCargo(data: { name: string; description?: string; phone?: string; location?: string; website?: string; facebook?: string }): Promise<Cargo> {
    return this.request<Cargo>("/admin/cargos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCargo(cargoId: string, data: { name: string; description?: string; phone?: string; location?: string; website?: string; facebook?: string }): Promise<Cargo> {
    return this.request<Cargo>(`/admin/cargos/${cargoId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCargo(cargoId: string): Promise<void> {
    return this.request<void>(`/admin/cargos/${cargoId}`, {
      method: "DELETE",
    });
  }

  async getAdminOrders(): Promise<Order[]> {
    return this.request<Order[]>("/admin/orders");
  }

  async verifyUserPayment(orderId: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}/verify-payment`, {
      method: "PUT",
    });
  }

  async cancelPayment(orderId: string, reason: string, orderType: "order" | "bundle" = "order"): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}/cancel-payment`, {
      method: "PUT",
      body: JSON.stringify({ reason, orderType }),
    });
  }

  async markAgentPaymentPaid(orderId: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}/agent-payment`, {
      method: "PUT",
    });
  }

  async markBundleAgentPaymentPaid(orderId: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/admin/bundle-orders/${orderId}/agent-payment`, {
      method: "PUT",
    });
  }

  // Admin Settings endpoints
  async getAdminSettings(): Promise<AdminSettings> {
    return this.request<AdminSettings>("/admin/settings");
  }

  async updateAdminSettings(data: AdminSettingsData): Promise<AdminSettings> {
    return this.request<AdminSettings>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Chat endpoints
  async getMessages(orderId: string): Promise<Message[]> {
    return this.request<Message[]>(`/orders/${orderId}/messages`);
  }

  async sendMessage(orderId: string, data: { text?: string; imageUrl?: string; audioUrl?: string; audioDuration?: number }): Promise<Message> {
    return this.request<Message>(`/orders/${orderId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLatestVoiceMessage(orderId: string): Promise<LatestVoiceMessage | null> {
    return this.request<LatestVoiceMessage | null>(`/orders/${orderId}/latest-voice`);
  }

  // Upload audio to Cloudinary
  async uploadAudio(base64: string): Promise<{ url: string }> {
    return this.request<{ url: string }>("/upload-image/audio", {
      method: "POST",
      body: JSON.stringify({ audio: base64 }),
    });
  }

  // Agent report endpoints
  async getAgentReport(orderId: string): Promise<AgentReport | null> {
    return this.request<AgentReport | null>(`/orders/${orderId}/report`);
  }

  async createAgentReport(orderId: string, data: AgentReportData): Promise<AgentReport> {
    return this.request<AgentReport>(`/orders/${orderId}/report`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAgentReport(orderId: string, data: AgentReportUpdateData): Promise<AgentReport> {
    return this.request<AgentReport>(`/orders/${orderId}/report`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Reward request endpoints (agent)
  async getMyRewardRequests(): Promise<RewardRequest[]> {
    return this.request<RewardRequest[]>("/agents/reward-requests");
  }

  async createRewardRequest(): Promise<RewardRequest> {
    return this.request<RewardRequest>("/agents/reward-request", {
      method: "POST",
    });
  }

  // Reward request endpoints (admin)
  async getRewardRequests(): Promise<RewardRequest[]> {
    return this.request<RewardRequest[]>("/admin/reward-requests");
  }

  async approveRewardRequest(requestId: string): Promise<RewardRequest> {
    return this.request<RewardRequest>(`/admin/reward-requests/${requestId}/approve`, {
      method: "PUT",
    });
  }

  async rejectRewardRequest(requestId: string): Promise<RewardRequest> {
    return this.request<RewardRequest>(`/admin/reward-requests/${requestId}/reject`, {
      method: "PUT",
    });
  }

  // Recalculate agent stats (admin)
  async recalculateAgentStats(): Promise<{ message: string; agents: Array<{ agentId: string; email: string; totalOrders: number; successfulOrders: number; successRate: number }> }> {
    return this.request<{ message: string; agents: Array<{ agentId: string; email: string; totalOrders: number; successfulOrders: number; successRate: number }> }>("/admin/recalculate-stats", {
      method: "POST",
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }

  // Notification endpoints
  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationsResponse> {
    return this.request<NotificationsResponse>(`/notifications?page=${page}&limit=${limit}`);
  }

  async getNotificationCount(): Promise<{ success: boolean; data: { unreadCount: number } }> {
    return this.request<{ success: boolean; data: { unreadCount: number } }>("/notifications/count");
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; data: Notification }> {
    return this.request<{ success: boolean; data: Notification }>(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/notifications/read-all", {
      method: "PUT",
    });
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  async sendTestEmail(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/notifications/test-email", {
      method: "POST",
    });
  }

  // Bundle Order endpoints
  async getBundleOrders(): Promise<BundleOrder[]> {
    return this.request<BundleOrder[]>("/bundle-orders");
  }

  async getBundleOrder(orderId: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}`);
  }

  async createBundleOrder(data: BundleOrderData): Promise<BundleOrder> {
    return this.request<BundleOrder>("/bundle-orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBundleOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, cancelReason }),
    });
  }

  async updateBundleItemStatus(orderId: string, itemId: string, status: OrderStatus): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/items/${itemId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async createBundleItemReport(orderId: string, itemId: string, data: BundleItemReportData): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/items/${itemId}/report`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBundleTrackCode(orderId: string, trackCode: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/track-code`, {
      method: "PUT",
      body: JSON.stringify({ trackCode }),
    });
  }

  async deleteBundleOrder(orderId: string): Promise<void> {
    return this.request<void>(`/bundle-orders/${orderId}`, {
      method: "DELETE",
    });
  }

  // Confirm user payment for bundle order
  async confirmBundleUserPayment(orderId: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/user-payment-confirmed`, {
      method: "PUT",
    });
  }

  // Cancel bundle order (user only)
  async cancelBundleOrder(orderId: string): Promise<{ id: string; status: string }> {
    return this.request<{ id: string; status: string }>(`/bundle-orders/${orderId}/cancel`, {
      method: "PUT",
    });
  }

  // Archive bundle order (user only)
  async archiveBundleOrder(orderId: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/archive`, {
      method: "PUT",
    });
  }

  // Remove item from bundle order (user only, when status is tolbor_huleej_bn)
  async removeItemFromBundle(orderId: string, itemId: string): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/items/${itemId}`, {
      method: "DELETE",
    });
  }

  // Create or update bundle report (single or per-item mode)
  async createBundleReport(orderId: string, data: BundleReportData): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/report`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Upload image to Cloudinary
  async uploadImage(base64: string): Promise<{ imageUrl: string }> {
    const result = await this.request<{ url: string }>("/upload-image", {
      method: "POST",
      body: JSON.stringify({ image: base64 }),
    });
    return { imageUrl: result.url };
  }

  // Card (Research Cards) endpoints
  async getCardBalance(): Promise<CardBalanceResponse> {
    return this.request<CardBalanceResponse>("/cards/balance");
  }

  async getCardHistory(page: number = 1, limit: number = 20): Promise<{ success: boolean; data: CardHistoryResponse }> {
    return this.request<{ success: boolean; data: CardHistoryResponse }>(`/cards/history?page=${page}&limit=${limit}`);
  }

  async giftCards(recipientPhone: string, amount: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/cards/gift", {
      method: "POST",
      body: JSON.stringify({ recipientPhone, amount }),
    });
  }

  async adminGiftCards(recipientPhone: string, amount: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/cards/admin/gift", {
      method: "POST",
      body: JSON.stringify({ recipientPhone, amount }),
    });
  }

  async grantCardsToAllUsers(amount?: number): Promise<{ success: boolean; message: string; data: { usersUpdated: number } }> {
    return this.request<{ success: boolean; message: string; data: { usersUpdated: number } }>("/cards/admin/grant-all", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  // Banner endpoints
  async getActiveBanners(): Promise<{ success: boolean; data: Banner[] }> {
    return this.request<{ success: boolean; data: Banner[] }>("/banners/active");
  }

  async getAllBanners(): Promise<{ success: boolean; data: Banner[] }> {
    return this.request<{ success: boolean; data: Banner[] }>("/banners");
  }

  async createBanner(data: Omit<Banner, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; data: Banner; message: string }> {
    return this.request<{ success: boolean; data: Banner; message: string }>("/banners", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBanner(id: string, data: Partial<Banner>): Promise<{ success: boolean; data: Banner; message: string }> {
    return this.request<{ success: boolean; data: Banner; message: string }>(`/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteBanner(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/banners/${id}`, {
      method: "DELETE",
    });
  }

  async toggleBannerStatus(id: string): Promise<{ success: boolean; data: Banner; message: string }> {
    return this.request<{ success: boolean; data: Banner; message: string }>(`/banners/${id}/toggle`, {
      method: "PATCH",
    });
  }

  // Product Showcase endpoints
  async getActiveShowcases(): Promise<{ success: boolean; data: ProductShowcase[] }> {
    return this.request<{ success: boolean; data: ProductShowcase[] }>("/showcases/active");
  }

  async getAllShowcases(): Promise<{ success: boolean; data: ProductShowcase[] }> {
    return this.request<{ success: boolean; data: ProductShowcase[] }>("/showcases");
  }

  async createShowcase(data: Omit<ProductShowcase, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; data: ProductShowcase; message: string }> {
    return this.request<{ success: boolean; data: ProductShowcase; message: string }>("/showcases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateShowcase(id: string, data: Partial<ProductShowcase>): Promise<{ success: boolean; data: ProductShowcase; message: string }> {
    return this.request<{ success: boolean; data: ProductShowcase; message: string }>(`/showcases/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteShowcase(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/showcases/${id}`, {
      method: "DELETE",
    });
  }

  async toggleShowcaseStatus(id: string): Promise<{ success: boolean; data: ProductShowcase; message: string }> {
    return this.request<{ success: boolean; data: ProductShowcase; message: string }>(`/showcases/${id}/toggle`, {
      method: "PATCH",
    });
  }
}

export type BannerType = "video" | "image" | "link";
export type BannerTarget = "all" | "user" | "agent";

export interface Banner {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  type: BannerType;
  url: string;
  thumbnailUrl?: string;
  isActive: boolean;
  order: number;
  targetAudience: BannerTarget;
  createdAt: string;
  updatedAt: string;
}

export interface ShowcaseProduct {
  name: string;
  image: string;
  price?: number;
  link?: string;
  badge?: "belen" | "zahialgaar";
}

export interface ProductShowcase {
  id: string;
  _id?: string;
  title: string;
  products: ShowcaseProduct[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cargo {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  location?: string;
  website?: string;
  facebook?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfile {
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
  specialties: string[];
  experienceYears?: number;
  rank: number;
  isTopAgent: boolean;
  totalTransactions: number;
  successRate: number;
  languages: string[];
  responseTime?: string;
  featured: boolean;
  availabilityStatus: "online" | "busy" | "offline";
  workingHours?: string;
  verifiedAt?: string;
}

export interface PublicAgent {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  specialties: string[];
  experienceYears?: number;
  rank: number;
  isTopAgent: boolean;
  orderCount: number;
  totalTransactions: number;
  successRate: number;
  languages: string[];
  responseTime?: string;
  featured: boolean;
  availabilityStatus: "online" | "busy" | "offline";
  workingHours?: string;
  avgRating: number;
  reviewCount: number;
  agentPoints: number;
  createdAt: string;
}

export interface AgentSpecialty {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface AgentReview {
  id: string;
  agentId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment?: string;
  userName?: string;
  createdAt: string;
}

export interface AgentProfileData {
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  languages?: string[];
  responseTime?: string;
  workingHours?: string;
  availabilityStatus?: "online" | "busy" | "offline";
  featured?: boolean;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  createdAt: string;
}

export interface LatestVoiceMessage {
  audioUrl: string;
  audioDuration?: number;
  senderId: string;
  createdAt: string;
}

export interface AgentReportEditHistory {
  editedAt: string;
  previousAmount: number;
  newAmount: number;
  reason?: string;
}

export interface AgentReport {
  id: string;
  orderId: string;
  userAmount: number;
  paymentLink?: string;
  additionalImages: string[];
  additionalDescription?: string;
  quantity?: number;
  editHistory?: AgentReportEditHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentReportData {
  userAmount: number;
  paymentLink?: string;
  additionalImages?: string[];
  additionalDescription?: string;
  quantity?: number;
}

export interface AgentReportUpdateData {
  userAmount?: number;
  paymentLink?: string;
  additionalDescription?: string;
  quantity?: number;
  editReason?: string;
}

export interface FooterSettings {
  aboutUs?: string;
  termsOfService?: string;
  faq?: string;
  email?: string;
  phone?: string;
  tutorial?: string;
  agentRegistration?: string;
  helpCenter?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  twitter?: string;
}

export interface AdminSettings {
  id: string;
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
  orderLimitEnabled?: boolean;
  maxOrdersPerDay?: number;
  maxActiveOrders?: number;
  footer?: FooterSettings;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettingsData {
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
  orderLimitEnabled?: boolean;
  maxOrdersPerDay?: number;
  maxActiveOrders?: number;
  footer?: FooterSettings;
}

export type RewardRequestStatus = "pending" | "approved" | "rejected";

// Bundle Order types
export interface BundleItem {
  id: string;
  productName: string;
  description: string;
  imageUrls: string[];
  status: OrderStatus;
  agentReport?: {
    userAmount: number;
    paymentLink?: string;
    additionalImages: string[];
    additionalDescription?: string;
    quantity?: number;
    createdAt: string;
  };
}

// Report for whole bundle (when reportMode is "single")
export interface BundleReport {
  totalUserAmount: number;
  paymentLink?: string;
  additionalImages?: string[];
  additionalDescription?: string;
}

export interface BundleOrder {
  id: string;
  userId: string;
  agentId?: string;
  userSnapshot: {
    name: string;
    phone: string;
    cargo: string;
  };
  items: BundleItem[];
  status: OrderStatus;
  userPaymentVerified?: boolean;
  agentPaymentPaid?: boolean;
  trackCode?: string;
  cancelReason?: string; // Reason for cancellation
  // Report mode: "single" = one price for whole bundle, "per_item" = price for each item
  reportMode?: "single" | "per_item";
  // Bundle-level report (used when reportMode is "single")
  bundleReport?: BundleReport;
  archivedByUser?: boolean;
  archivedByAgent?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  agent?: User;
}

export interface BundleOrderData {
  items: Array<{
    productName: string;
    description: string;
    imageUrls?: string[];
  }>;
}

export interface BundleItemReportData {
  userAmount: number;
  paymentLink?: string;
  additionalImages?: string[];
  additionalDescription?: string;
  quantity?: number;
}

// Data for creating/updating bundle-level report
export interface BundleReportData {
  reportMode: "single" | "per_item";
  // For "single" mode
  bundleReport?: {
    totalUserAmount: number;
    paymentLink?: string;
    additionalImages?: string[];
    additionalDescription?: string;
  };
  // For "per_item" mode
  itemReports?: Array<{
    itemId: string;
    userAmount: number;
    paymentLink?: string;
    additionalImages?: string[];
    additionalDescription?: string;
    quantity?: number;
  }>;
}

export interface RewardRequest {
  id: string;
  agentId: string;
  amount: number;
  status: RewardRequestStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  createdAt: string;
  updatedAt: string;
  agent?: User;
}

// Notification types
export type NotificationType =
  | "agent_report_sent"
  | "agent_cancelled_order"
  | "admin_cancelled_order"
  | "agent_added_track_code"
  | "new_order_available"
  | "payment_verified"
  | "payment_verification_request"
  | "reward_request";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: NotificationPagination;
}

// Card (Research Cards) types
export type CardTransactionType =
  | "initial_grant"
  | "admin_gift"
  | "agent_gift"
  | "user_transfer"
  | "order_deduction"
  | "order_refund"
  | "bundle_item_removal";

export interface CardTransaction {
  id: string;
  fromUserId?: string;
  toUserId: string;
  amount: number;
  type: CardTransactionType;
  recipientPhone?: string;
  orderId?: string;
  note?: string;
  createdAt: string;
  fromUserName?: string;
  toUserName?: string;
}

export interface CardHistoryResponse {
  transactions: CardTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CardBalanceResponse {
  success: boolean;
  data: {
    balance: number;
  };
}

export const apiClient = new ApiClient(API_BASE_URL);

