"use client";

import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Content */}
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Үйлчилгээний нөхцөл
          </h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            <p className="text-gray-600">
              Сүүлд шинэчлэгдсэн: 2024 оны 1 сарын 1
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Ерөнхий нөхцөл
              </h2>
              <p className="text-gray-600 leading-relaxed">
                AgentBuy платформыг ашигласнаар та доорх үйлчилгээний
                нөхцөлүүдийг хүлээн зөвшөөрч байна. Хэрэв та эдгээр нөхцөлийг
                хүлээн зөвшөөрөхгүй бол манай үйлчилгээг ашиглахгүй байхыг
                хүсье.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Үйлчилгээний тодорхойлолт
              </h2>
              <p className="text-gray-600 leading-relaxed">
                AgentBuy нь хэрэглэгчдийг Хятадаас бараа худалдан авахад туслах
                агентуудтай холбож өгдөг зуучлалын платформ юм. Бид шууд бараа
                худалдах биш, харин захиалга хүлээн авах, агенттай холбох
                үйлчилгээ үзүүлдэг.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Хэрэглэгчийн үүрэг
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Үнэн зөв мэдээлэл өгөх</li>
                <li>Төлбөрийг хугацаанд нь төлөх</li>
                <li>Хууль бус бараа захиалахгүй байх</li>
                <li>Бусад хэрэглэгч, агентуудыг хүндэтгэх</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Төлбөр
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Барааны үнэ, тээврийн зардал, үйлчилгээний хураамж зэргийг агент
                тайлан дээр тодорхой заасан байна. Төлбөр төлсний дараа захиалга
                баталгаажна.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Буцаалт
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Агент барааг судалж эхлэхээс өмнө захиалгаа цуцлах боломжтой.
                Төлбөр төлсний дараа буцаалт хийгдэхгүй бөгөөд бараатай
                холбоотой асуудлыг агенттай шууд шийдвэрлэнэ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Хариуцлагын хязгаарлалт
              </h2>
              <p className="text-gray-600 leading-relaxed">
                AgentBuy нь барааны чанар, хүргэлтийн хугацаа зэрэгт шууд
                хариуцлага хүлээхгүй. Гэхдээ бид агентуудыг сонгохдоо нарийн
                шалгаруулалт хийж, чанартай үйлчилгээ үзүүлэхийг эрмэлздэг.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Нөхцөлийн өөрчлөлт
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Бид үйлчилгээний нөхцөлийг хэдийд ч өөрчлөх эрхтэй. Өөрчлөлт
                орсон тохиолдолд хэрэглэгчдэд мэдэгдэх болно.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Холбоо барих
              </h2>
              <p className="text-gray-600">
                Асуулт байвал:{" "}
                <a
                  href="mailto:agentbuy.app@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  agentbuy.app@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
