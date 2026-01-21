"use client";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Content */}
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Бидний тухай</h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">AgentBuy гэж юу вэ?</h2>
              <p className="text-gray-600 leading-relaxed">
                AgentBuy бол Хятадаас бараа захиалах хамгийн хялбар, найдвартай платформ юм. Бид хэрэглэгчдэд
                Taobao, 1688, Pinduoduo зэрэг Хятадын томоохон худалдааны сайтуудаас бараа захиалахад
                туслах мэргэжлийн агентуудтай холбож өгдөг.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Бидний давуу тал</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Найдвартай агентууд:</strong> Бүх агентууд шалгарсан, туршлагатай мэргэжилтнүүд</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Хялбар үйлчилгээ:</strong> Захиалга өгөхөд хэдхэн минут л хангалттай</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Тунгалаг үнэ:</strong> Бараа болон үйлчилгээний төлбөр тодорхой, нуугдмал төлбөргүй</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Шуурхай хүргэлт:</strong> Карго үйлчилгээтэй хамтран ажилладаг</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Хэрхэн ажилладаг вэ?</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">1</div>
                  <h3 className="font-medium text-gray-900 mb-1">Захиалга өгөх</h3>
                  <p className="text-sm text-gray-600">Хүссэн барааныхаа линк, зургийг оруулна</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">2</div>
                  <h3 className="font-medium text-gray-900 mb-1">Агент судлах</h3>
                  <p className="text-sm text-gray-600">Агент барааг шалгаж, үнийн санал өгнө</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">3</div>
                  <h3 className="font-medium text-gray-900 mb-1">Төлбөр & Хүргэлт</h3>
                  <p className="text-sm text-gray-600">Төлбөр төлж, барааг хүлээн авна</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Холбоо барих</h2>
              <p className="text-gray-600">
                Асуулт байвал бидэнтэй холбогдоорой: <a href="mailto:agentbuy.app@gmail.com" className="text-blue-600 hover:underline">agentbuy.app@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
