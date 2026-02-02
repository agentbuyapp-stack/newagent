import { z } from "zod";

// ============ Auth Schemas ============
export const registerSchema = z.object({
  email: z.string().email("И-мэйл хаяг буруу байна"),
  role: z.enum(["user", "agent"]).optional().default("user"),
});

// ============ Profile Schemas ============
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байх ёстой").max(100),
  phone: z.string().min(8, "Утасны дугаар хамгийн багадаа 8 тэмдэгт байх ёстой").max(20),
  email: z.string().email("И-мэйл хаяг буруу байна"),
  cargo: z.string().optional(),
  accountNumber: z.string().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

// ============ Order Schemas ============
export const createOrderSchema = z.object({
  productName: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).max(3, "Хамгийн ихдээ 3 зураг оруулах боломжтой").optional(),
  products: z.array(z.object({
    productName: z.string().min(1),
    description: z.string().min(1),
    imageUrls: z.array(z.string()).optional(),
  })).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "niitlegdsen",
    "agent_sudlaj_bn",
    "tolbor_huleej_bn",
    "amjilttai_zahialga",
    "tsutsalsan_zahialga",
  ]),
  cancelReason: z.string().optional(),
});

// ============ Message Schemas ============
export const sendMessageSchema = z.object({
  text: z.string().min(1, "Мессеж хоосон байж болохгүй").max(2000, "Мессеж хэт урт байна").optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  audioDuration: z.number().min(0).max(60).optional(), // max 60 seconds
}).refine(data => data.text || data.imageUrl || data.audioUrl, {
  message: "Мессеж, зураг эсвэл дуу шаардлагатай",
});

// ============ Agent Report Schemas ============
export const agentReportSchema = z.object({
  userAmount: z.number().min(1, "Юань дүн 0-ээс их байх ёстой"),
  paymentLink: z.string().optional(),
  additionalImages: z.array(z.string()).max(3).optional(),
  additionalDescription: z.string().max(2000).optional(),
  quantity: z.number().min(1).optional(),
  editReason: z.string().max(500).optional(),
});

// ============ Bundle Order Schemas ============
export const createBundleOrderSchema = z.object({
  items: z.array(z.object({
    productName: z.string().min(1, "Барааны нэр шаардлагатай"),
    description: z.string().min(1, "Тайлбар шаардлагатай"),
    imageUrl: z.string().optional(),
  })).min(1, "Хамгийн багадаа 1 бараа байх ёстой").max(10, "Хамгийн ихдээ 10 бараа"),
});

export const updateBundleOrderStatusSchema = z.object({
  status: z.enum([
    "niitlegdsen",
    "agent_sudlaj_bn",
    "tolbor_huleej_bn",
    "amjilttai_zahialga",
    "tsutsalsan_zahialga",
  ]),
  cancelReason: z.string().optional(),
});

// ============ Cargo Schemas ============
export const cargoSchema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт").max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

// ============ Admin Schemas ============
export const updateSettingsSchema = z.object({
  exchangeRate: z.number().min(1, "Ханш 1-ээс их байх ёстой").optional(),
  agentCommissionPercent: z.number().min(0).max(100).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "agent", "admin"]),
});

// ============ Notification Schemas ============
export const notificationIdSchema = z.object({
  notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID буруу формат"),
});

// ============ ID Params Schema ============
export const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID буруу формат"),
});

export const orderIdSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Order ID буруу формат"),
});

// ============ Card Schemas ============
export const giftCardsSchema = z.object({
  recipientPhone: z.string().min(8, "Утасны дугаар хамгийн багадаа 8 тэмдэгт").max(20),
  amount: z.number().min(1, "Хамгийн багадаа 1 карт илгээх боломжтой"),
});

export const purchaseCardsSchema = z.object({
  amount: z.number().min(1, "Хамгийн багадаа 1 карт худалдан авах боломжтой"),
});

export const adminGiftCardsSchema = z.object({
  recipientPhone: z.string().min(8, "Утасны дугаар хамгийн багадаа 8 тэмдэгт").max(20),
  amount: z.number().min(1, "Хамгийн багадаа 1 карт бэлэглэх боломжтой"),
});
