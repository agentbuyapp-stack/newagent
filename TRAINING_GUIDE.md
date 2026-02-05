# AgentBuy - Хөгжүүлэгчийн Сургалтын Материал

> Хятадаас бараа захиалах платформ - Бүрэн техникийн гарын авлага

---

## Агуулга

1. [Төслийн тойм](#1-төслийн-тойм)
2. [Технологийн стек](#2-технологийн-стек)
3. [Төслийн бүтэц](#3-төслийн-бүтэц)
4. [Backend архитектур](#4-backend-архитектур)
5. [Frontend архитектур](#5-frontend-архитектур)
6. [Өгөгдлийн сангийн моделүүд](#6-өгөгдлийн-сангийн-моделүүд)
7. [Бизнес логик ба ажлын урсгал](#7-бизнес-логик-ба-ажлын-урсгал)
8. [Аутентикаци ба авторизаци](#8-аутентикаци-ба-авторизаци)
9. [Real-time функцүүд (Socket.io)](#9-real-time-функцүүд-socketio)
10. [AI Support систем](#10-ai-support-систем)
11. [Файл байршуулалт](#11-файл-байршуулалт)
12. [API endpoints лавлагаа](#12-api-endpoints-лавлагаа)
13. [Frontend hooks ба state management](#13-frontend-hooks-ба-state-management)
14. [Environment тохиргоо](#14-environment-тохиргоо)
15. [Шинэ feature нэмэх жишээ](#15-шинэ-feature-нэмэх-жишээ)

---

## 1. Төслийн тойм

**AgentBuy** нь хэрэглэгчдийг Хятадаас бараа худалдан авах агентуудтай холбодог платформ юм.

### Гурван төрлийн хэрэглэгч:

| Роль | Тайлбар |
|------|---------|
| **User** | Бараа захиалга үүсгэнэ, төлбөр төлнө |
| **Agent** | Захиалгыг хүлээн авч, бараа худалдан авч, хүргүүлнэ |
| **Admin** | Платформыг удирдана, төлбөр баталгаажуулна, агент зөвшөөрнө |

### Захиалгын үндсэн урсгал:

```
User захиалга үүсгэнэ
    → Agent захиалга хүлээн авна
    → Agent үнийн мэдээлэл (report) илгээнэ
    → User төлбөр төлнө
    → Agent бараа худалдан авч илгээнэ
    → Agent tracking code нэмнэ
    → Захиалга дууссан
```

---

## 2. Технологийн стек

### Backend
| Технологи | Хэрэглээ |
|-----------|----------|
| **Express.js** | HTTP сервер |
| **TypeScript** | Төрлийн аюулгүй байдал |
| **MongoDB + Mongoose** | Өгөгдлийн сан |
| **Socket.io** | Real-time харилцаа |
| **Clerk** | Аутентикаци |
| **Anthropic Claude** | AI support чатбот |
| **Cloudinary** | Зураг/аудио хадгалах |
| **Nodemailer** | И-мэйл илгээх |
| **Zod** | Request validation |
| **Helmet** | Security headers |

### Frontend
| Технологи | Хэрэглээ |
|-----------|----------|
| **Next.js 16** | React фреймворк (App Router) |
| **React 19** | UI library |
| **TypeScript** | Төрлийн аюулгүй байдал |
| **Tailwind CSS v4** | Загвар (Styling) |
| **Clerk** | Аутентикаци (frontend) |
| **Socket.io Client** | Real-time холболт |

---

## 3. Төслийн бүтэц

```
newagent/
├── backend/
│   └── src/
│       ├── index.ts              ← Серверийн эхлэлийн цэг
│       ├── config/               ← CORS, Swagger тохиргоо
│       ├── controllers/          ← Route handler-ууд (14 файл)
│       ├── models/               ← Mongoose schema-ууд (20 файл)
│       ├── routes/               ← Express route-ууд (13 файл)
│       ├── services/             ← Бизнес логик (9 файл)
│       ├── middleware/           ← Auth, validation, rate limit
│       ├── utils/                ← Туслах функцүүд
│       ├── lib/                  ← MongoDB, Socket.io холболт
│       └── schemas/              ← Zod validation schema-ууд
│
└── frontend/
    └── src/
        ├── app/                  ← Next.js App Router хуудсууд
        │   ├── page.tsx          ← Нүүр хуудас
        │   ├── layout.tsx        ← Root layout
        │   ├── user/dashboard/   ← Хэрэглэгчийн dashboard
        │   ├── agent/dashboard/  ← Агентийн dashboard
        │   └── admin/dashboard/  ← Админ dashboard
        ├── components/           ← React компонентүүд
        │   ├── admin/            ← Админ компонентүүд
        │   ├── agent/            ← Агент компонентүүд
        │   ├── user/             ← Хэрэглэгч компонентүүд
        │   ├── dashboard/        ← Нийтлэг dashboard компонентүүд
        │   └── shared/           ← Дундын компонентүүд
        ├── hooks/                ← Custom React hooks
        ├── contexts/             ← React Context (Socket)
        ├── lib/                  ← API client, helpers
        └── styles/               ← Design system
```

---

## 4. Backend архитектур

### 4.1 Давхаргын загвар (Layer pattern)

Backend нь **Controller → Service → Model** загвараар бүтэцлэгдсэн:

```
Request → Middleware → Controller → Service → Model → MongoDB
                                                ↓
Response ← Controller ← Service (formatted data)
```

**Файл:** `backend/src/index.ts` (Серверийн эхлэл)

```typescript
// Middleware стек
app.use(helmet());           // Security headers
app.use(compression());      // Gzip шахалт
app.use(cors(corsOptions));  // CORS тохиргоо
app.use(express.json());     // JSON парсинг
app.use(rateLimit);          // Rate limiting

// Route-ууд
app.use("/auth", authRoutes);
app.use("/me", clerkAuth, authRoutes);
app.use("/profile", clerkAuth, profileRoutes);
app.use("/orders", clerkAuth, orderRoutes);
app.use("/bundle-orders", clerkAuth, bundleOrderRoutes);
app.use("/admin", clerkAuth, adminRoutes);
app.use("/agents", agentRoutes);
app.use("/cargos", cargoRoutes);
app.use("/cards", clerkAuth, cardRoutes);
app.use("/notifications", clerkAuth, notificationRoutes);
app.use("/support", supportRoutes);
app.use("/upload-image", clerkAuth, uploadRoutes);
```

### 4.2 Controller жишээ

Controller нь HTTP request хүлээн авч, service-руу дамжуулна:

```typescript
// backend/src/controllers/orderController.ts

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  // 1. Хэрэглэгч нэвтэрсэн эсэхийг шалгах
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  // 2. Service-руу дамжуулах
  const { data, error, status } = await orderService.createOrder(
    req.user.id,
    req.body
  );

  // 3. Алдаа байвал буцаах
  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  // 4. Амжилттай хариу
  res.status(201).json(data);
};
```

### 4.3 Service жишээ

Service нь бизнес логик агуулна:

```typescript
// backend/src/services/orderService.ts

export const createOrder = async (userId: string, body: any) => {
  try {
    // 1. Хэрэглэгчийн хязгаарлалт шалгах
    const limitCheck = await checkOrderLimits(userId);
    if (limitCheck.error) {
      return { error: limitCheck.error, status: 400 };
    }

    // 2. Research card шалгах, хасах
    const user = await User.findById(userId);
    if (user.researchCards < 1) {
      return { error: "Судалгааны карт хүрэлцэхгүй байна", status: 400 };
    }
    await cardService.deductCards(userId, 1, "order_deduction");

    // 3. Захиалга үүсгэх
    const order = await Order.create({
      userId,
      productName: body.productName,
      description: body.description,
      imageUrls: body.imageUrls,
      status: "niitlegdsen",
    });

    // 4. Агентуудад мэдэгдэл илгээх
    await notificationService.notifyAgentsNewOrder(order._id);

    return { data: formatOrder(order) };
  } catch (error) {
    return { error: "Захиалга үүсгэхэд алдаа гарлаа", status: 500 };
  }
};
```

### 4.4 Middleware

**Аутентикаци** (`middleware/clerkAuth.ts`):
```typescript
// Clerk token шалгаж, MongoDB User-тэй холбоно
export const clerkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const clerkUser = await verifyToken(token);
  const user = await User.findOne({ email: clerkUser.email });
  req.user = user;
  next();
};
```

**Ролийн шалгалт** (`middleware/requireRole.ts`):
```typescript
export const requireRole = (roles: string | string[]) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

// Хэрэглээ:
router.post("/agents", requireRole("admin"), addAgent);
router.get("/settings", requireRole(["user", "agent", "admin"]), getSettings);
```

---

## 5. Frontend архитектур

### 5.1 App Router хуудсууд

Next.js 16-ийн App Router ашиглаж, хуудсуудыг `app/` folder-т байрлуулна:

```
app/
├── page.tsx                    ← "/" нүүр хуудас
├── layout.tsx                  ← Бүх хуудасны layout
├── login/page.tsx              ← Нэвтрэх хуудас
├── user/dashboard/page.tsx     ← Хэрэглэгчийн dashboard
├── agent/dashboard/page.tsx    ← Агентийн dashboard
├── admin/dashboard/page.tsx    ← Админ dashboard
├── about/page.tsx              ← Тухай хуудас
├── faq/page.tsx                ← Түгээмэл асуулт
└── tutorial/page.tsx           ← Заавар
```

### 5.2 API Client

Бүх API дуудлагыг `ApiClient` класс удирдана:

```typescript
// frontend/src/lib/api.ts

class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  // Ерөнхий fetch функц
  private async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  // Захиалга үүсгэх жишээ
  async createOrder(data: CreateOrderData): Promise<Order> {
    return this.fetch("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Захиалгууд авах
  async getOrders(): Promise<Order[]> {
    return this.fetch("/orders");
  }
}
```

**ApiClient-г Hook-оор ашиглах:**

```typescript
// frontend/src/lib/useApiClient.ts

export function useApiClient() {
  const { getToken } = useAuth(); // Clerk-ийн hook

  return useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return new ApiClient(apiUrl, getToken);
  }, [getToken]);
}
```

### 5.3 Компонент бүтэц

Dashboard хуудас → Tab-ууд → Компонентүүд:

```typescript
// frontend/src/app/user/dashboard/page.tsx

export default function UserDashboard() {
  const apiClient = useApiClient();
  const { user, orders, bundleOrders, loading } = useUserData(apiClient);

  return (
    <div>
      <NewOrderForm onSubmit={handleCreateOrder} />
      <OrderHistorySection orders={orders} />
      <BundleOrderHistorySection bundleOrders={bundleOrders} />
      <TopAgentsSection />
      <CargosSection />
    </div>
  );
}
```

---

## 6. Өгөгдлийн сангийн моделүүд

### 6.1 Гол моделүүд ба тэдгээрийн хамаарал

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│   User   │────→│  Order   │←────│ AgentReport  │
│          │     │          │     │              │
│ email    │     │ userId   │     │ orderId      │
│ role     │     │ agentId  │     │ userAmount   │
│ agentPts │     │ status   │     │ paymentLink  │
│ resCards │     │ trackCode│     │ addImages[]  │
└──────┬───┘     └──────────┘     └──────────────┘
       │
       │         ┌──────────────┐  ┌──────────────┐
       ├────────→│ BundleOrder  │  │   Profile     │
       │         │              │  │              │
       │         │ items[]      │  │ name, phone  │
       │         │ reportMode   │  │ cargo        │
       │         └──────────────┘  └──────────────┘
       │
       │         ┌──────────────┐  ┌──────────────┐
       ├────────→│ Notification │  │CardTransaction│
       │         │              │  │              │
       │         │ type, title  │  │ amount, type │
       │         │ isRead       │  │ from/to User │
       │         └──────────────┘  └──────────────┘
       │
       │         ┌──────────────┐  ┌──────────────┐
       └────────→│RewardRequest │  │ AgentReview  │
                 │              │  │              │
                 │ amount       │  │ rating       │
                 │ status       │  │ review text  │
                 └──────────────┘  └──────────────┘
```

### 6.2 User Model

```typescript
// backend/src/models/User.ts

const UserSchema = new Schema({
  email:        { type: String, required: true, unique: true },
  role:         { type: String, enum: ["user", "agent", "admin"], default: "user" },
  isApproved:   { type: Boolean, default: false },   // Агентуудад
  agentPoints:  { type: Number, default: 0 },        // Агентийн оноо
  researchCards: { type: Number, default: 0 },        // Судалгааны карт

  // Агентийн профайл (role === "agent" үед)
  agentProfile: {
    avatarUrl:    String,
    displayName:  String,
    bio:          String,
    specialties:  [{ type: Schema.Types.ObjectId, ref: "AgentSpecialty" }],
    rank:         { type: Number, default: 999 },
    isTopAgent:   { type: Boolean, default: false },
    totalTransactions: { type: Number, default: 0 },
    successRate:  { type: Number, default: 0 },
    languages:    [String],
    availabilityStatus: { type: String, default: "available" },
  }
}, { timestamps: true });
```

### 6.3 Order Model ба статусууд

```typescript
// backend/src/models/Order.ts

const OrderSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  agentId:  { type: Schema.Types.ObjectId, ref: "User" },

  productName:  { type: String, required: true },
  description:  { type: String, required: true },
  imageUrls:    [String],                           // Бүтээгдэхүүний зураг (max 3)

  status: {
    type: String,
    enum: [
      "niitlegdsen",           // Нийтлэгдсэн (шинэ)
      "agent_sudlaj_bn",      // Агент судалж байна
      "tolbor_huleej_bn",     // Төлбөр хүлээж байна
      "amjilttai_zahialga",   // Амжилттай захиалга
      "tsutsalsan_zahialga",  // Цуцалсан захиалга
    ],
    default: "niitlegdsen",
  },

  userPaymentVerified: { type: Boolean, default: false },
  agentPaymentPaid:    { type: Boolean, default: false },
  trackCode:           String,
  cancelReason:        String,
  archivedByUser:      { type: Boolean, default: false },
  archivedByAgent:     { type: Boolean, default: false },
}, { timestamps: true });
```

**Статус шилжилт:**

```
niitlegdsen ──→ agent_sudlaj_bn ──→ tolbor_huleej_bn ──→ amjilttai_zahialga
     │                  │                    │
     └──────────────────┴────────────────────┴──→ tsutsalsan_zahialga
```

### 6.4 BundleOrder Model

Олон бүтээгдэхүүнийг нэг захиалгад нэгтгэнэ:

```typescript
const BundleOrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  agentId: { type: Schema.Types.ObjectId, ref: "User" },

  // Хэрэглэгчийн мэдээлэл (snapshot)
  userSnapshot: {
    name:  String,
    phone: String,
    cargo: String,
  },

  // Олон бүтээгдэхүүн
  items: [{
    productName:  String,
    description:  String,
    imageUrls:    [String],
    status:       String,   // Item бүр өөрийн статустай
    report: {               // Item бүрийн report (per_item mode)
      userAmount:   Number,
      paymentLink:  String,
      additionalImages: [String],
    },
  }],

  reportMode: { type: String, enum: ["single", "per_item"] },

  // Нэг report (single mode)
  bundleReport: {
    totalUserAmount:   Number,
    paymentLink:       String,
    additionalImages:  [String],
  },
});
```

### 6.5 Бусад чухал моделүүд

| Model | Файл | Зориулалт |
|-------|------|-----------|
| **Profile** | `models/Profile.ts` | Нэр, утас, карго, дансны дугаар |
| **AgentReport** | `models/AgentReport.ts` | Үнийн мэдээлэл, төлбөрийн линк |
| **Notification** | `models/Notification.ts` | Мэдэгдэл (16 төрөл) |
| **Message** | `models/Message.ts` | Захиалгын чат (текст, зураг, дуу) |
| **CardTransaction** | `models/CardTransaction.ts` | Research card гүйлгээ |
| **RewardRequest** | `models/RewardRequest.ts` | Агентийн шагналын хүсэлт |
| **Cargo** | `models/Cargo.ts` | Тээврийн компани мэдээлэл |
| **AdminSettings** | `models/AdminSettings.ts` | Ханш, данс, хязгаарлалт |
| **SupportChat** | `models/SupportChat.ts` | AI дэмжлэг чат |
| **KnowledgeBase** | `models/KnowledgeBase.ts` | AI мэдлэгийн сан |
| **AgentSpecialty** | `models/AgentSpecialty.ts` | Мэргэшлийн төрлүүд |
| **AgentReview** | `models/AgentReview.ts` | Агентийн үнэлгээ |

---

## 7. Бизнес логик ба ажлын урсгал

### 7.1 Захиалгын бүрэн урсгал

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER: Захиалга үүсгэх                                      │
│    - productName, description, imageUrls (max 3) оруулна       │
│    - Research card 1 ширхэг хасагдана                          │
│    - Бүх агентуудад мэдэгдэл явна                              │
│    - Статус: "niitlegdsen"                                     │
├─────────────────────────────────────────────────────────────────┤
│ 2. AGENT: Захиалга хүлээн авах                                 │
│    - Агент "Хүлээн авах" товч дарна                            │
│    - agentId = тухайн агент                                    │
│    - Статус: "agent_sudlaj_bn"                                 │
│    - User-т мэдэгдэл: "Агент таны захиалгыг судалж байна"     │
│    - Чат идэвхжинэ (Message model)                             │
├─────────────────────────────────────────────────────────────────┤
│ 3. AGENT: Report илгээх                                        │
│    - AgentReport үүсгэнэ:                                      │
│      · userAmount (¥ дүн)                                      │
│      · paymentLink (Alipay/WeChat Pay линк)                    │
│      · Нэмэлт зураг, тайлбар                                  │
│    - Статус: "tolbor_huleej_bn"                                │
│    - User-т мэдэгдэл: "Агент үнийн мэдээлэл илгээлээ"        │
├─────────────────────────────────────────────────────────────────┤
│ 4. USER: Төлбөр баталгаажуулах                                 │
│    - User гадна системээр төлбөр хийнэ (банк, Alipay)          │
│    - "Төлбөр төллөө" товч дарна                                │
│    - userPaymentVerified = true                                 │
│    - Статус: "amjilttai_zahialga"                              │
│    - Admin-д мэдэгдэл: төлбөр баталгаажуулах хүсэлт           │
├─────────────────────────────────────────────────────────────────┤
│ 5. ADMIN: Төлбөр шалгах                                       │
│    - Банкны данс шалгаж баталгаажуулна                          │
│    - Агентийн төлбөрийг "Төлсөн" гэж тэмдэглэнэ               │
│    - agentPaymentPaid = true                                    │
├─────────────────────────────────────────────────────────────────┤
│ 6. AGENT: Tracking code нэмэх                                  │
│    - Бараа илгээсний дараа tracking code оруулна               │
│    - User-т мэдэгдэл: "Tracking code нэмэгдлээ"               │
├─────────────────────────────────────────────────────────────────┤
│ 7. Захиалга дууссан                                            │
│    - User архивлах боломжтой                                   │
│    - User агентад review үлдээж болно                          │
│    - Агент reward request илгээж болно                          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Research Card систем

Research card нь захиалга үүсгэхэд шаардлагатай дотоод валют юм:

```
Шинэ хэрэглэгч → 5 карт (анхны бэлэг)
  │
  ├─ Захиалга үүсгэх → -1 карт (order_deduction)
  ├─ Захиалга цуцлах → +1 карт буцаалт (order_refund)
  ├─ Админ бэлэглэх  → +N карт (admin_gift)
  ├─ Хэрэглэгч бэлэглэх → ±N карт (user_transfer)
  └─ Bundle item устгах → +1 карт (bundle_item_removal)
```

**CardTransaction model** бүх гүйлгээг бүртгэнэ:

```typescript
// type: "initial_grant" | "admin_gift" | "agent_gift" |
//       "user_transfer" | "purchase" | "order_deduction" |
//       "order_refund" | "bundle_item_removal"
```

### 7.3 Шагналын систем (Rewards)

```
Агент захиалга гүйцэтгэнэ
    → agentPoints нэмэгдэнэ
    → Агент RewardRequest илгээнэ (хүссэн дүн)
    → Админ хянана
    → Зөвшөөрвөл: agentPoints хасагдана + гадна системээр мөнгө шилжүүлнэ
    → Татгалзвал: agentPoints хэвээр
```

### 7.4 Мэдэгдлийн систем

16 төрлийн мэдэгдэл:

| Төрөл | Хэн хүлээн авна | Тайлбар |
|-------|-----------------|---------|
| `order_created` | Агентууд | Шинэ захиалга гарлаа |
| `order_assigned` | User | Агент хүлээн авлаа |
| `order_status_changed` | User/Agent | Статус өөрчлөгдлөө |
| `agent_report_sent` | User | Report илгээгдлээ |
| `payment_verified` | Agent | Төлбөр баталгаажлаа |
| `track_code_added` | User | Tracking code нэмэгдлээ |
| `order_cancelled` | User/Agent | Цуцлагдлаа |
| `agent_cancelled_order` | User | Агент цуцаллаа |
| `admin_cancelled_order` | User | Админ цуцаллаа |
| `reward_request` | Admin | Шагналын хүсэлт |
| `support_handoff` | Admin | AI support → хүнд шилжүүлэх |
| `new_order_available` | Agents | Шинэ захиалга авах боломжтой |

**Мэдэгдэл илгээх замууд:**
1. In-app мэдэгдэл (Notification collection)
2. И-мэйл (Profile.emailNotificationsEnabled = true үед)
3. Real-time Socket.io (холбогдсон хэрэглэгчдэд)

---

## 8. Аутентикаци ба авторизаци

### 8.1 Clerk холболт

**Серверийн тал:**

```typescript
// middleware/clerkAuth.ts - Ерөнхий урсгал

1. Client → Bearer token илгээнэ (Authorization header)
2. clerkAuth middleware:
   a. Token-г задлана
   b. Clerk API-аар шалгана (verifyToken)
   c. Clerk user-ийн email-аар MongoDB User олно
   d. Байхгүй бол шинэ User үүсгэнэ
   e. req.user = MongoDB User object
3. Дараагийн middleware/controller руу дамжуулна
```

**Клиентийн тал:**

```typescript
// frontend/src/lib/useApiClient.ts

import { useAuth } from "@clerk/nextjs";

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return new ApiClient(API_URL, getToken);
  }, [getToken]);
}

// Дуудлага хийхэд автоматаар Bearer token нэмнэ
```

### 8.2 Роль шалгах

```typescript
// Ганц роль шалгах
router.post("/agents", requireRole("admin"), addAgent);

// Олон роль шалгах
router.get("/settings", requireRole(["user", "agent", "admin"]), getSettings);
```

---

## 9. Real-time функцүүд (Socket.io)

### 9.1 Серверийн тохиргоо

```typescript
// backend/src/lib/socket.ts

// Өрөөнүүд:
// - user:${userId}    → Хэрэглэгчийн хувийн өрөө (мэдэгдэл)
// - order:${orderId}  → Захиалгын өрөө (чат)

io.on("connection", (socket) => {
  // Хэрэглэгч нэвтрэхэд
  socket.on("join", (userId) => {
    socket.join(`user:${userId}`);
  });

  // Захиалгын чат-д нэгдэхэд
  socket.on("join-order", (orderId) => {
    socket.join(`order:${orderId}`);
  });
});

// Дуут мессеж илгээх
export const emitNewVoiceMessage = (recipientUserId, orderId, voiceMessage) => {
  io.to(`user:${recipientUserId}`).emit("new-voice-message", voiceMessage);
  io.to(`order:${orderId}`).emit("new-voice-message", voiceMessage);
};
```

### 9.2 Frontend-ийн Socket холболт

```typescript
// frontend/src/contexts/SocketContext.tsx

export function SocketProvider({ children, userId }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(SOCKET_URL);
    newSocket.emit("join", userId);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, joinOrder, leaveOrder }}>
      {children}
    </SocketContext.Provider>
  );
}
```

---

## 10. AI Support систем

### 10.1 Архитектур

```
User → SupportWidget → Backend → Claude Haiku API → Хариу
                                       ↑
                              KnowledgeBase (FAQ)
                              + System Prompt
```

### 10.2 Мэдлэгийн сан (KnowledgeBase)

Урьдчилан бэлдсэн FAQ-ууд AI-ийн контекст болно:

```typescript
// models/KnowledgeBase.ts
{
  category: "general",
  question: "AgentBuy гэж юу вэ?",
  answer: "Хятадаас бараа захиалах платформ...",
  keywords: ["агентбай", "юу вэ"],
  isActive: true,
}
```

### 10.3 AI дуудлага

```typescript
// services/openaiService.ts

export const chatWithAI = async (messages: ChatMessage[]): Promise<ChatResponse> => {
  // 1. Knowledge base авах
  const knowledgeContent = await getKnowledgeBaseContent();

  // 2. System prompt бэлдэх ({{knowledge_base}} placeholder-г солино)
  const systemPrompt = await buildSystemPrompt();

  // 3. Claude API дуудах
  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 150,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  // 4. HANDOFF_REQUESTED шалгах (хүнд шилжүүлэх)
  const handoffRequested = assistantMessage.includes("HANDOFF_REQUESTED");

  return { message: cleanMessage, handoffRequested };
};
```

### 10.4 System Prompt тохируулах

Admin dashboard-аас system prompt-г өөрчлөх боломжтой:

```typescript
// models/SupportConfig.ts - Key-value хадгалалт
{
  key: "system_prompt",
  value: "Та AgentBuy-ийн дэмжлэгийн AI туслах юм..."
}
```

---

## 11. Файл байршуулалт

### Cloudinary интеграци

```typescript
// backend/src/utils/cloudinary.ts

// Frontend: base64 руу хувиргана → Backend-руу илгээнэ
// Backend: Cloudinary-д upload → URL буцаана

export const uploadToCloudinary = async (base64: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(base64, {
    folder: "agentbuy",
  });
  return result.secure_url;
};
```

**Хэрэглээ:**
- Захиалгын зураг (max 3 ширхэг)
- Агентийн avatar
- Agent report-ийн нэмэлт зураг
- Дуут мессеж (audio/webm → base64 → Cloudinary)

---

## 12. API Endpoints лавлагаа

### Аутентикаци
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/me` | Одоогийн хэрэглэгч |
| POST | `/auth/register` | Бүртгүүлэх |

### Захиалга
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/orders` | Захиалгуудыг авах (роль-аар шүүнэ) |
| GET | `/orders/:id` | Нэг захиалгын дэлгэрэнгүй |
| POST | `/orders` | Шинэ захиалга үүсгэх |
| PUT | `/orders/:id/status` | Статус өөрчлөх |
| PUT | `/orders/:id/track-code` | Tracking code нэмэх |
| PUT | `/orders/:id/confirm-payment` | Төлбөр баталгаажуулах |
| DELETE | `/orders/:id` | Устгах |
| PUT | `/orders/:id/archive` | Архивлах |

### Bundle захиалга
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/bundle-orders` | Bundle захиалгууд |
| POST | `/bundle-orders` | Шинэ bundle |
| PUT | `/bundle-orders/:id/status` | Статус өөрчлөх |
| PUT | `/bundle-orders/:id/items/:itemId/report` | Item report |
| PUT | `/bundle-orders/:id/report` | Bundle report |
| DELETE | `/bundle-orders/:id/items/:itemId` | Item устгах |

### Агент report
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/orders/:id/report` | Report авах |
| POST | `/orders/:id/report` | Report үүсгэх |
| PUT | `/orders/:id/report` | Report засах |

### Мессеж (чат)
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/orders/:id/messages` | Чат түүх |
| POST | `/orders/:id/messages` | Мессеж илгээх |

### Агентууд (public)
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/agents/public` | Бүх агентууд |
| GET | `/agents/top` | Топ агентууд |
| GET | `/agents/specialties` | Мэргэшлүүд |
| GET | `/agents/:id/reviews` | Агентийн review-ууд |
| POST | `/agents/:id/reviews` | Review үлдээх |
| GET | `/agents/reward-requests` | Шагналын хүсэлтүүд |
| POST | `/agents/reward-request` | Шагнал хүсэх |

### Admin
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| POST | `/admin/agents` | Агент нэмэх |
| GET | `/admin/agents` | Бүх агентууд |
| PUT | `/admin/agents/:id/approve` | Зөвшөөрөх |
| PUT | `/admin/agents/:id/profile` | Профайл засах |
| PUT | `/admin/agents/:id/rank` | Рэнк өөрчлөх |
| GET | `/admin/orders` | Бүх захиалгууд |
| PUT | `/admin/orders/:id/verify-payment` | Төлбөр баталгаажуулах |
| PUT | `/admin/orders/:id/agent-payment` | Агентийн төлбөр |
| GET | `/admin/settings` | Тохиргоо авах |
| PUT | `/admin/settings` | Тохиргоо хадгалах |
| GET | `/admin/reward-requests` | Шагналын хүсэлтүүд |
| PUT | `/admin/reward-requests/:id/approve` | Зөвшөөрөх |
| PUT | `/admin/reward-requests/:id/reject` | Татгалзах |

### Карт (Research cards)
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/cards/balance` | Үлдэгдэл |
| GET | `/cards/history` | Түүх (paginated) |
| POST | `/cards/gift` | Бэлэглэх |
| POST | `/cards/admin-gift` | Админ бэлэглэх |

### Мэдэгдэл
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| GET | `/notifications` | Мэдэгдлүүд |
| GET | `/notifications/count` | Уншаагүй тоо |
| PUT | `/notifications/:id/read` | Уншсан тэмдэглэх |
| PUT | `/notifications/read-all` | Бүгдийг уншсан |

### AI Support
| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| POST | `/support/chat` | AI-тай ярих |
| GET | `/support/session/:id` | Session авах |
| POST | `/support/handoff` | Хүнд шилжүүлэх |
| GET | `/support/admin/chats` | Хүлээж буй чатууд |
| POST | `/support/admin/reply` | Админ хариу |

---

## 13. Frontend hooks ба state management

### 13.1 Гол hooks

| Hook | Файл | Зориулалт |
|------|------|-----------|
| `useUserData` | `hooks/useUserData.ts` | User dashboard-ийн бүх өгөгдөл |
| `useAgentData` | `hooks/useAgentData.ts` | Agent dashboard-ийн бүх өгөгдөл |
| `useAdminData` | `hooks/useAdminData.ts` | Admin dashboard-ийн бүх өгөгдөл |
| `useOrderActions` | `hooks/useOrderActions.ts` | Захиалгын үйлдлүүд (agent) |
| `useUserActions` | `hooks/useUserActions.ts` | Захиалгын үйлдлүүд (user) |
| `useAdminActions` | `hooks/useAdminActions.ts` | Админ үйлдлүүд |
| `useAgentOrders` | `hooks/useAgentOrders.ts` | Агентийн захиалга шүүх, хуудаслах |
| `useSocket` | `hooks/useSocket.ts` | Socket.io холболт |
| `useVoiceRecording` | `hooks/useVoiceRecording.ts` | Дуу бичих |
| `useSupportChat` | `hooks/useSupportChat.ts` | AI support чат |
| `useAgentReports` | `hooks/useAgentReports.ts` | Агент report удирдах |

### 13.2 Hook хэрэглээний жишээ

```typescript
// User dashboard-д ашиглах
function UserDashboard() {
  const apiClient = useApiClient();

  // 1. Өгөгдөл татах
  const {
    user,
    orders,
    bundleOrders,
    cargos,
    agents,
    settings,
    loading,
    refreshOrders,
  } = useUserData(apiClient);

  // 2. Үйлдлүүд
  const {
    handleDeleteOrder,
    handleCancelOrder,
    handlePaymentPaid,
    handleSendVoiceMessage,
  } = useUserActions(apiClient, refreshOrders);

  // 3. Socket
  const { joinOrder, leaveOrder, newVoiceMessages } = useSocket(user?.id);

  return (
    <div>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onCancel={handleCancelOrder}
          onPayment={handlePaymentPaid}
        />
      ))}
    </div>
  );
}
```

---

## 14. Environment тохиргоо

### Backend `.env`

```env
# Сервер
PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/agentbuy

# Clerk аутентикаци
CLERK_SECRET_KEY=sk_test_...

# CORS
CORS_ORIGINS=http://localhost:3000

# Cloudinary (зураг хадгалалт)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# И-мэйл (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Dev горимд Clerk шалгалтыг алгасах
DISABLE_CLERK_AUTH=true
```

### Frontend `.env.local`

```env
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## 15. Шинэ feature нэмэх жишээ

Жишээ нь: **"Хэрэглэгчид хүсэлтийн жагсаалт (wishlist) нэмэх"**

### Алхам 1: Model үүсгэх

```typescript
// backend/src/models/Wishlist.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  productName: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productName: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: String,
  },
  { timestamps: true }
);

export const Wishlist = mongoose.model<IWishlist>("Wishlist", WishlistSchema);
```

### Алхам 2: Controller үүсгэх

```typescript
// backend/src/controllers/wishlistController.ts
import { Request, Response } from "express";
import { Wishlist } from "../models/Wishlist";

export const getWishlist = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });

  const items = await Wishlist.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(items);
};

export const addToWishlist = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });

  const item = await Wishlist.create({
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json(item);
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });

  await Wishlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ success: true });
};
```

### Алхам 3: Route нэмэх

```typescript
// backend/src/routes/wishlistRoutes.ts
import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController";

const router = Router();

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:id", removeFromWishlist);

export default router;
```

### Алхам 4: Route бүртгэх

```typescript
// backend/src/index.ts дотор нэмэх
import wishlistRoutes from "./routes/wishlistRoutes";
app.use("/wishlist", clerkAuth, wishlistRoutes);
```

### Алхам 5: Frontend API нэмэх

```typescript
// frontend/src/lib/api.ts дотор ApiClient class-д нэмэх

// Interface
export interface WishlistItem {
  id: string;
  productName: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

// Methods
async getWishlist(): Promise<WishlistItem[]> {
  return this.fetch("/wishlist");
}

async addToWishlist(data: { productName: string; description: string }): Promise<WishlistItem> {
  return this.fetch("/wishlist", { method: "POST", body: JSON.stringify(data) });
}

async removeFromWishlist(id: string): Promise<void> {
  return this.fetch(`/wishlist/${id}`, { method: "DELETE" });
}
```

### Алхам 6: Frontend компонент

```typescript
// frontend/src/components/WishlistSection.tsx
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@/lib/useApiClient";
import type { WishlistItem } from "@/lib/api";

export function WishlistSection() {
  const apiClient = useApiClient();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    apiClient.getWishlist().then(setItems);
  }, []);

  const handleAdd = async (data: { productName: string; description: string }) => {
    const newItem = await apiClient.addToWishlist(data);
    setItems((prev) => [newItem, ...prev]);
  };

  const handleRemove = async (id: string) => {
    await apiClient.removeFromWishlist(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Хүсэлтийн жагсаалт</h3>
      {items.map((item) => (
        <div key={item.id} className="border rounded-xl p-4 flex justify-between">
          <div>
            <p className="font-medium">{item.productName}</p>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
          <button
            onClick={() => handleRemove(item.id)}
            className="text-red-500 text-sm"
          >
            Устгах
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Алхам 7: Dashboard-д нэмэх

```typescript
// frontend/src/app/user/dashboard/page.tsx дотор
import { WishlistSection } from "@/components/WishlistSection";

// JSX дотор нэмэх:
<WishlistSection />
```

---

## Тусгай тэмдэглэл

### Кодын стандарт

1. **Монгол хэл** - UI текстүүд Монгол хэлээр
2. **TypeScript** - Бүх файлд type-тай
3. **Tailwind CSS** - Inline style ашиглахгүй
4. **rounded-xl** - Бүх элемент дугуй булантай
5. **min-h-10/11** - Товчнууд хүрэхэд хялбар хэмжээтэй

### Өнгөний систем

| Өнгө | Хэрэглээ |
|------|----------|
| `blue-500` | Засах, ерөнхий үйлдэл |
| `green-500` | Хадгалах, амжилттай |
| `red-500` | Устгах, цуцлах |
| `purple-500` | Тусгай үйлдэл |
| `gray-200` | Цуцлах товч |

### Хуудаслалт загвар

```typescript
// Pagination pattern
const [page, setPage] = useState(1);
const ITEMS_PER_PAGE = 10;

const { data, total } = await apiClient.getItems(page, ITEMS_PER_PAGE);
const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
```

---

> **Энэ баримтыг** шинэ хөгжүүлэгч эсвэл одоогийн багийн гишүүд кодын бүтэц, бизнес логикийг ойлгоход ашиглаж болно.
