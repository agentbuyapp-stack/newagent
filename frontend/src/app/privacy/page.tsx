"use client";

import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Content */}
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Нууцлалын бодлого</h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            <p className="text-gray-600">Сүүлд шинэчлэгдсэн: 2024 оны 1 сарын 1</p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Цуглуулдаг мэдээлэл</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Бид дараах мэдээллийг цуглуулж, хадгалдаг:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Хэрэглэгчийн нэр, имэйл хаяг</li>
                <li>Утасны дугаар</li>
                <li>Карго мэдээлэл (хүргэлтийн хаяг)</li>
                <li>Захиалгын түүх</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Мэдээллийг хэрхэн ашигладаг</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Захиалга боловсруулах, хүргэх</li>
                <li>Хэрэглэгчтэй холбогдох</li>
                <li>Үйлчилгээг сайжруулах</li>
                <li>Хууль ёсны шаардлагыг хангах</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Мэдээллийн хамгаалалт</h2>
              <p className="text-gray-600 leading-relaxed">
                Бид таны хувийн мэдээллийг хамгаалахын тулд орчин үеийн аюулгүй байдлын арга хэмжээг
                авч хэрэгжүүлдэг. Мэдээллийг зөвшөөрөлгүй хандалт, алдагдал, гэмтлээс хамгаалахын
                тулд шифрлэлт болон бусад техникийн хамгаалалт ашигладаг.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Гуравдагч талтай хуваалцах</h2>
              <p className="text-gray-600 leading-relaxed">
                Таны мэдээллийг зөвхөн захиалга биелүүлэхэд шаардлагатай тохиолдолд л агент болон
                карго компанитай хуваалцдаг. Бид таны мэдээллийг зар сурталчилгааны зорилгоор
                гуравдагч талд худалдахгүй.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Күүки (Cookies)</h2>
              <p className="text-gray-600 leading-relaxed">
                Бид веб сайтын ажиллагааг сайжруулах, хэрэглэгчийн туршлагыг дээшлүүлэхийн тулд
                күүки ашигладаг. Та хөтчийнхөө тохиргоогоор күүкиг идэвхгүй болгох боломжтой.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Таны эрх</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Өөрийн мэдээллийг үзэх, засах</li>
                <li>Мэдээллээ устгуулах хүсэлт гаргах</li>
                <li>Маркетингийн мэдэгдлээс татгалзах</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Холбоо барих</h2>
              <p className="text-gray-600">
                Нууцлалын бодлоготой холбоотой асуулт байвал: <a href="mailto:agentbuy.app@gmail.com" className="text-blue-600 hover:underline">agentbuy.app@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
