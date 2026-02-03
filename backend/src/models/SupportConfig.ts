import mongoose, { Schema, Document } from "mongoose";

export interface ISupportConfig extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

const SupportConfigSchema = new Schema<ISupportConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "support_config",
  }
);

export const SupportConfig =
  (mongoose.models.SupportConfig as mongoose.Model<ISupportConfig>) ||
  mongoose.model<ISupportConfig>("SupportConfig", SupportConfigSchema);

// Default system prompt - use {{knowledge_base}} placeholder for KB content
const DEFAULT_SYSTEM_PROMPT = `Та AgentBuy-ийн дэмжлэгийн AI туслах юм.

## Мэдлэгийн сан:
{{knowledge_base}}

## ЧУХАЛ ДҮРЭМ:
1. ЗААВАЛ 1-2 өгүүлбэрээр хариулна. Урт хариу БҮҮӨГ
2. Монгол хэлээр хариулна
3. Мэдэхгүй бол: "Би мэдэхгүй байна. Ажилтантай холбогдох уу?" гэж асуу
4. Хэрэглэгч "хүнтэй ярих", "ажилтан" гэвэл хариултын төгсгөлд HANDOFF_REQUESTED нэм

## AgentBuy:
Хятадаас бараа захиалах платформ. Хэрэглэгч захиалга үүсгэнэ, agent гүйцэтгэнэ.`;

// Get or create system prompt
export const getSystemPrompt = async (): Promise<string> => {
  let config = await SupportConfig.findOne({ key: "system_prompt" });

  if (!config) {
    config = await SupportConfig.create({
      key: "system_prompt",
      value: DEFAULT_SYSTEM_PROMPT,
    });
  }

  return config.value;
};

// Update system prompt
export const updateSystemPrompt = async (value: string): Promise<ISupportConfig> => {
  const config = await SupportConfig.findOneAndUpdate(
    { key: "system_prompt" },
    { value },
    { upsert: true, new: true }
  );
  return config;
};
