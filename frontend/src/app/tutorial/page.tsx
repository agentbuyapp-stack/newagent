"use client";

const steps = [
  {
    num: "1",
    title: "Бүртгүүлэх",
    color: "bg-blue-500",
    desc: "Эхлээд AgentBuy-д бүртгүүлнэ. Утасны дугаар болон нууц үгээрээ бүртгүүлэх боломжтой.",
    items: [
      "Нүүр хуудас дээрх \"Нэвтрэх\" товч дарна",
      "Утас, нууц үг, имэйлээр бүртгүүлнэ",
      "Профайл хэсэгт нэр, утас, карго мэдээллээ оруулна",
    ],
  },
  {
    num: "2",
    title: "Захиалга үүсгэх",
    color: "bg-blue-500",
    desc: "Хүссэн барааныхаа мэдээллийг оруулж захиалга үүсгэнэ.",
    items: [
      "\"Шинэ захиалга\" товч дарна",
      "Барааны нэр, тайлбар бичнэ",
      "Барааны линк эсвэл зураг оруулна",
      "Хүссэн тоо ширхэг, өнгө, хэмжээ зэргийг заана",
      "\"Захиалга илгээх\" товч дарна",
    ],
  },
  {
    num: "3",
    title: "Агентын тайлан хүлээх",
    color: "bg-blue-500",
    desc: "Агент таны захиалгыг судалж, үнийн санал бэлтгэнэ.",
    items: [
      "Агент барааг олж, үнийг шалгана",
      "Худалдагчийн найдвартай эсэхийг шалгана",
      "Тайлан дээр барааны үнэ, тээврийн зардал, үйлчилгээний хураамж заагдана",
      "Чат хэсгээр агенттай холбогдож асуулт асуух боломжтой",
    ],
  },
  {
    num: "4",
    title: "Төлбөр төлөх",
    color: "bg-blue-500",
    desc: "Тайланг хүлээн зөвшөөрч төлбөрөө төлнө.",
    items: [
      "Тайлан дээрх нийт дүнг шалгана",
      "Заасан дансанд төлбөрөө шилжүүлнэ",
      "\"Төлбөр төлсөн\" товч дарна",
      "Admin төлбөрийг баталгаажуулсны дараа агент барааг захиална",
    ],
  },
  {
    num: "5",
    title: "Бараа хүлээн авах",
    color: "bg-green-500",
    desc: "Агент барааг захиалж, карго руу хүргүүлнэ.",
    items: [
      "Агент бараа ирэхэд track code өгнө",
      "Карго компанийн апп-аар бараагаа хянана",
      "Бараа Монголд ирэхэд карго компаниас мэдэгдэл ирнэ",
      "Карго компаниас барааг авна",
    ],
  },
];

export default function TutorialPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Заавар сургалт
          </h1>
          <p className="text-[13px] sm:text-base text-gray-600 mb-5 sm:mb-8">
            AgentBuy ашиглан Хятадаас бараа захиалах алхам алхмаар заавар
          </p>

          <div className="space-y-4 sm:space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 ${step.color} rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-xl shrink-0`}>
                    {step.num}
                  </div>
                  <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                    {step.title}
                  </h2>
                </div>
                <div className="pl-12 sm:pl-16">
                  <p className="text-[13px] sm:text-base text-gray-600 mb-2.5 sm:mb-4">
                    {step.desc}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-0.5 sm:space-y-1">
                    {step.items.map((item) => (
                      <li key={item} className="text-[12px] sm:text-base">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 sm:mt-8 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-[14px] sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500"
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
            <ul className="space-y-1.5 sm:space-y-2 text-gray-600">
              {[
                "Карго мэдээллээ зөв оруулсан эсэхээ шалгаарай",
                "Барааны линк, зураг аль болох тодорхой оруулаарай",
                "Асуулт байвал агенттай чатаар холбогдоорой",
                "Төлбөр төлөхдөө гүйлгээний утгыг зөв бичээрэй",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-1.5 sm:gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span className="text-[12px] sm:text-base">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
