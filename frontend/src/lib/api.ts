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

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // Update track code for order (agent/admin only)
  async updateTrackCode(orderId: string, trackCode: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/track-code`, {
      method: "PUT",
      body: JSON.stringify({ trackCode }),
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

  async createCargo(data: { name: string; description?: string }): Promise<Cargo> {
    return this.request<Cargo>("/admin/cargos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCargo(cargoId: string, data: { name: string; description?: string }): Promise<Cargo> {
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

  async markAgentPaymentPaid(orderId: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${orderId}/agent-payment`, {
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

  async sendMessage(orderId: string, data: { text?: string; imageUrl?: string }): Promise<Message> {
    return this.request<Message>(`/orders/${orderId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
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

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
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

  async updateBundleOrderStatus(orderId: string, status: OrderStatus): Promise<BundleOrder> {
    return this.request<BundleOrder>(`/bundle-orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
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
}

export interface Cargo {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
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

export interface AdminSettings {
  id: string;
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettingsData {
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
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

export const apiClient = new ApiClient(API_BASE_URL);

