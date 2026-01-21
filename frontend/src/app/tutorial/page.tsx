"use client";

import Footer from "@/components/Footer";

export default function TutorialPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Content */}
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Заавар сургалт
          </h1>
          <p className="text-gray-600 mb-8">
            AgentBuy ашиглан Хятадаас бараа захиалах алхам алхмаар заавар
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Бүртгүүлэх
                </h2>
              </div>
              <div className="pl-16">
                <p className="text-gray-600 mb-4">
                  Эхлээд AgentBuy-д бүртгүүлнэ. Google эсвэл имэйл хаягаараа
                  бүртгүүлэх боломжтой.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Нүүр хуудас дээрх &quot;Нэвтрэх&quot; товч дарна</li>
                  <li>Google эсвэл имэйлээр бүртгүүлнэ</li>
                  <li>Профайл хэсэгт нэр, утас, карго мэдээллээ оруулна</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Захиалга үүсгэх
                </h2>
              </div>
              <div className="pl-16">
                <p className="text-gray-600 mb-4">
                  Хүссэн барааныхаа мэдээллийг оруулж захиалга үүсгэнэ.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>&quot;Шинэ захиалга&quot; товч дарна</li>
                  <li>Барааны нэр, тайлбар бичнэ</li>
                  <li>Барааны линк эсвэл зураг оруулна</li>
                  <li>Хүссэн тоо ширхэг, өнгө, хэмжээ зэргийг заана</li>
                  <li>&quot;Захиалга илгээх&quot; товч дарна</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Агентын тайлан хүлээх
                </h2>
              </div>
              <div className="pl-16">
                <p className="text-gray-600 mb-4">
                  Агент таны захиалгыг судалж, үнийн санал бэлтгэнэ.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Агент барааг олж, үнийг шалгана</li>
                  <li>Худалдагчийн найдвартай эсэхийг шалгана</li>
                  <li>
                    Тайлан дээр барааны үнэ, тээврийн зардал, үйлчилгээний
                    хураамж заагдана
                  </li>
                  <li>Чат хэсгээр агенттай холбогдож асуулт асуух боломжтой</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Төлбөр төлөх
                </h2>
              </div>
              <div className="pl-16">
                <p className="text-gray-600 mb-4">
                  Тайланг хүлээн зөвшөөрч төлбөрөө төлнө.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Тайлан дээрх нийт дүнг шалгана</li>
                  <li>Заасан дансанд төлбөрөө шилжүүлнэ</li>
                  <li>&quot;Төлбөр төлсөн&quot; товч дарна</li>
                  <li>
                    Admin төлбөрийг баталгаажуулсны дараа агент барааг захиална
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  5
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Бараа хүлээн авах
                </h2>
              </div>
              <div className="pl-16">
                <p className="text-gray-600 mb-4">
                  Агент барааг захиалж, карго руу хүргүүлнэ.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Агент бараа ирэхэд track code өгнө</li>
                  <li>Карго компанийн апп-аар бараагаа хянана</li>
                  <li>Бараа Монголд ирэхэд карго компаниас мэдэгдэл ирнэ</li>
                  <li>Карго компаниас барааг авна</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Зөвлөмж
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Карго мэдээллээ зөв оруулсан эсэхээ шалгаарай</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Барааны линк, зураг аль болох тодорхой оруулаарай</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Асуулт байвал агенттай чатаар холбогдоорой</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Төлбөр төлөхдөө гүйлгээний утгыг зөв бичээрэй</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
