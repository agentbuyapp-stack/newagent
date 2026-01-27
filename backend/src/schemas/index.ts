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
  productName: z.string().min(3, "Барааны нэр хамгийн багадаа 3 тэмдэгт байх ёстой").max(255),
  description: z.string().min(10, "Тайлбар хамгийн багадаа 10 тэмдэгт байх ёстой").max(5000),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).max(3, "Хамгийн ихдээ 3 зураг оруулах боломжтой").optional(),
  products: z.array(z.object({
    productName: z.string().min(1),
    description: z.string().min(1),
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
});

// ============ Message Schemas ============
export const sendMessageSchema = z.object({
  content: z.string().min(1, "Мессеж хоосон байж болохгүй").max(2000, "Мессеж хэт урт байна"),
  imageUrl: z.string().optional(),
});

// ============ Agent Report Schemas ============
export const agentReportSchema = z.object({
  products: z.array(z.object({
    productName: z.string().min(1, "Барааны нэр шаардлагатай"),
    productUrl: z.string().url("URL буруу байна").optional().or(z.literal("")),
    productImageUrl: z.string().optional(),
    quantity: z.number().min(1, "Тоо ширхэг 1-ээс их байх ёстой"),
    unitPriceYuan: z.number().min(0, "Үнэ 0-ээс их байх ёстой"),
  })).min(1, "Хамгийн багадаа 1 бараа байх ёстой"),
  domesticShippingYuan: z.number().min(0).optional().default(0),
  note: z.string().max(1000).optional(),
});

// ============ Bundle Order Schemas ============
export const createBundleOrderSchema = z.object({
  items: z.array(z.object({
    productName: z.string().min(1, "Барааны нэр шаардлагатай"),
    description: z.string().min(1, "Тайлбар шаардлагатай"),
    imageUrl: z.string().optional(),
  })).min(1, "Хамгийн багадаа 1 бараа байх ёстой").max(10, "Хамгийн ихдээ 10 бараа"),
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
