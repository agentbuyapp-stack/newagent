import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledgeBase extends Document {
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    category: {
      type: String,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    keywords: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "knowledge_base",
  }
);

// Text index for search
KnowledgeBaseSchema.index({ question: "text", answer: "text", keywords: "text" });

export const KnowledgeBase =
  (mongoose.models.KnowledgeBase as mongoose.Model<IKnowledgeBase>) ||
  mongoose.model<IKnowledgeBase>("KnowledgeBase", KnowledgeBaseSchema);

// Seed default knowledge base data
export const seedKnowledgeBase = async () => {
  const count = await KnowledgeBase.countDocuments();
  if (count > 0) return;

  const defaultKnowledge = [
    {
      category: "orders",
      question: "Захиалга хэрхэн өгөх вэ?",
      answer:
        "1. Сайтад бүртгүүлж нэвтэрнэ\n2. Dashboard хэсэгт 'Шинэ захиалга' товч дарна\n3. Барааны линк, тоо ширхэг, өнгө/хэмжээ оруулна\n4. Захиалга илгээнэ\n5. Agent захиалгыг авч гүйцэтгэнэ",
      keywords: ["захиалга", "order", "өгөх", "хэрхэн"],
    },
    {
      category: "payment",
      question: "Төлбөр хэрхэн төлөх вэ?",
      answer:
        "Agent тайлан илгээсний дараа төлбөр төлнө. Төлбөрийн мэдээллийг тайлангаас харж, шилжүүлэг хийнэ. Дараа нь 'Төлбөр баталгаажуулах' товч дарна.",
      keywords: ["төлбөр", "payment", "төлөх", "шилжүүлэг"],
    },
    {
      category: "shipping",
      question: "Бараа хэзээ ирэх вэ?",
      answer:
        "Хятадаас Монгол хүртэл ихэвчлэн 7-14 хоногт ирдэг. Track код оруулсны дараа та ачааны байршлыг хянах боломжтой.",
      keywords: ["хүргэлт", "shipping", "ирэх", "хэзээ", "хугацаа"],
    },
    {
      category: "shipping",
      question: "Track код гэж юу вэ?",
      answer:
        "Track код нь ачааны байршлыг хянах код юм. Agent барааг илгээсний дараа track код оруулна. Та үүнийг ашиглан бараа хаана явж байгааг мэдэх боломжтой.",
      keywords: ["track", "код", "ачаа", "байршил"],
    },
    {
      category: "agent",
      question: "Agent гэж хэн бэ?",
      answer:
        "Agent нь Хятадад байрлах, таны захиалгыг гүйцэтгэх хүн юм. Тэд барааг худалдан авч, Монгол руу илгээдэг.",
      keywords: ["agent", "агент", "хэн"],
    },
    {
      category: "refund",
      question: "Буцаалт хийж болох уу?",
      answer:
        "Бараа илгээгдсэний дараа буцаалт хийх боломжгүй. Гэхдээ бараа ирэхээс өмнө agent-тай чатаар холбогдож асуудлыг шийдэж болно.",
      keywords: ["буцаалт", "refund", "буцаах"],
    },
    {
      category: "contact",
      question: "Холбоо барих",
      answer:
        "Та захиалгынхаа чат хэсгээр agent-тай шууд холбогдож болно. Эсвэл энэ чатаар асуултаа бичнэ үү.",
      keywords: ["холбоо", "contact", "харилцах"],
    },
    {
      category: "price",
      question: "Үнэ хэрхэн тооцогдох вэ?",
      answer:
        "Барааны үнэ + Хятад дотоод хүргэлт + Агентын шимтгэл = Нийт үнэ (юань). Төлбөрийг юань-аар тооцож, төгрөгөөр төлнө.",
      keywords: ["үнэ", "price", "тооцох", "шимтгэл"],
    },
  ];

  await KnowledgeBase.insertMany(defaultKnowledge);
  console.log("Knowledge base seeded with default data");
};
