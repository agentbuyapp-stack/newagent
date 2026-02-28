"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "AgentBuy хэрхэн ажилладаг вэ?",
    answer:
      "Та хүссэн барааныхаа линк эсвэл зургийг оруулж захиалга үүсгэнэ. Манай агент барааг судалж, үнийн санал өгнө. Та төлбөрөө төлсний дараа агент барааг захиалж, карго руу хүргүүлнэ.",
  },
  {
    question: "Ямар сайтуудаас бараа захиалах боломжтой вэ?",
    answer:
      "Taobao, 1688, Pinduoduo, JD, Tmall зэрэг Хятадын бүх томоохон худалдааны сайтуудаас захиалах боломжтой.",
  },
  {
    question: "Хэр удаан хугацаанд бараа ирдэг вэ?",
    answer:
      "Ердийн карго үйлчилгээгээр 10-20 хоног, шуурхай үйлчилгээгээр 7-14 хоногт бараа Монголд ирдэг. Хугацаа нь барааны хэмжээ, жин, карго компанийн ачааллаас хамаарна.",
  },
  {
    question: "Төлбөрийг хэрхэн төлөх вэ?",
    answer:
      "Дансаар шилжүүлэг хийх боломжтой. Агентын тайлан дээр барааны үнэ, тээврийн зардал, үйлчилгээний хураамж тодорхой заагдсан байна.",
  },
  {
    question: "Захиалгаа цуцлах боломжтой юу?",
    answer:
      "Агент барааг судалж эхлэхээс өмнө та захиалгаа цуцлах боломжтой. Төлбөр төлсний дараа буцаалт хийгдэхгүй.",
  },
  {
    question: "Барааны чанарыг хэрхэн баталгаажуулдаг вэ?",
    answer:
      "Манай агентууд барааг захиалахаасаа өмнө худалдагчийн үнэлгээ, барааны сэтгэгдэл зэргийг шалгаж, танд мэдээлэл өгдөг. Бараа ирэхэд асуудал гарвал агенттай холбогдож шийдвэрлэнэ.",
  },
  {
    question: "Үйлчилгээний хураамж хэд вэ?",
    answer:
      "Үйлчилгээний хураамж нь барааны үнийн 5% байна. Энэ нь агентын тайлан дээр тодорхой заагдсан байна.",
  },
  {
    question: "Агенттай хэрхэн холбогдох вэ?",
    answer:
      "Захиалга үүсгэсний дараа чат функцээр дамжуулан агенттай шууд харилцах боломжтой.",
  },
  {
    question: "Нэг удаад хэдэн бараа захиалах боломжтой вэ?",
    answer: "Хязгааргүй. Та хүссэн хэмжээгээрээ захиалга өгч болно.",
  },
  {
    question: "Карго мэдээллээ хэрхэн оруулах вэ?",
    answer:
      "Профайл хэсэгт очиж карго мэдээллээ оруулна. Энэ мэдээллийг агент бараа хүргүүлэхэд ашиглана.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Түгээмэл асуулт хариулт
          </h1>
          <p className="text-[13px] sm:text-base text-gray-600 mb-5 sm:mb-8">
            Хэрэглэгчдээс ихэвчлэн асуудаг асуултууд болон хариултууд
          </p>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-100 last:border-b-0"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between gap-3 sm:gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-[13px] sm:text-base">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 shrink-0 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                    <p className="text-[13px] sm:text-base text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
              Асуултаа олсонгүй юу?
            </h2>
            <p className="text-[13px] sm:text-base text-gray-600 mb-3 sm:mb-4">
              Бидэнтэй холбогдоорой, бид танд туслахдаа баяртай байна.
            </p>
            <a
              href="mailto:agentbuy.app@gmail.com"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-[13px] sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Имэйл илгээх
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
