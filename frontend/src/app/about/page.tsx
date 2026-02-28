"use client";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-5 sm:mb-8">Бидний тухай</h1>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            <section>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">AgentBuy гэж юу вэ?</h2>
              <p className="text-[13px] sm:text-base text-gray-600 leading-relaxed">
                AgentBuy бол Хятадаас бараа захиалах хамгийн хялбар, найдвартай платформ юм. Бид хэрэглэгчдэд
                Taobao, 1688, Pinduoduo зэрэг Хятадын томоохон худалдааны сайтуудаас бараа захиалахад
                туслах мэргэжлийн агентуудтай холбож өгдөг.
              </p>
            </section>

            <section>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Бидний давуу тал</h2>
              <ul className="space-y-2.5 sm:space-y-3 text-gray-600">
                {[
                  { bold: "Найдвартай агентууд:", text: "Бүх агентууд шалгарсан, туршлагатай мэргэжилтнүүд" },
                  { bold: "Хялбар үйлчилгээ:", text: "Захиалга өгөхөд хэдхэн минут л хангалттай" },
                  { bold: "Тунгалаг үнэ:", text: "Бараа болон үйлчилгээний төлбөр тодорхой, нуугдмал төлбөргүй" },
                  { bold: "Шуурхай хүргэлт:", text: "Карго үйлчилгээтэй хамтран ажилладаг" },
                ].map((item) => (
                  <li key={item.bold} className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[13px] sm:text-base"><strong>{item.bold}</strong> {item.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Хэрхэн ажилладаг вэ?</h2>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {[
                  { num: "1", title: "Захиалга өгөх", desc: "Хүссэн барааныхаа линк, зургийг оруулна" },
                  { num: "2", title: "Агент судлах", desc: "Агент барааг шалгаж, үнийн санал өгнө" },
                  { num: "3", title: "Төлбөр & Хүргэлт", desc: "Төлбөр төлж, барааг хүлээн авна" },
                ].map((step) => (
                  <div key={step.num} className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-white font-bold text-[13px] sm:text-base">{step.num}</div>
                    <h3 className="font-medium text-gray-900 mb-0.5 sm:mb-1 text-[12px] sm:text-base">{step.title}</h3>
                    <p className="text-[11px] sm:text-sm text-gray-600">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Холбоо барих</h2>
              <p className="text-[13px] sm:text-base text-gray-600">
                Асуулт байвал бидэнтэй холбогдоорой: <a href="mailto:agentbuy.app@gmail.com" className="text-blue-600 hover:underline">agentbuy.app@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
