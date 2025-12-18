import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding cargos...");

  const cargos = [
    { name: "Хувцас", description: "Хувцас, гутал" },
    { name: "Гоо сайхны бүтээгдэхүүн", description: "Гоо сайхны бүтээгдэхүүн" },
    { name: "Цахилгаан бараа", description: "Цахилгаан бараа, техник" },
    { name: "Гэрийн хэрэглэл", description: "Гэрийн хэрэглэл" },
    { name: "Бусад", description: "Бусад бараа" },
  ];

  for (const cargo of cargos) {
    try {
      await prisma.cargo.upsert({
        where: { name: cargo.name },
        update: {},
        create: cargo,
      });
      console.log(`✅ Created/Updated: ${cargo.name}`);
    } catch (error: any) {
      console.error(`❌ Error creating ${cargo.name}:`, error.message);
    }
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

