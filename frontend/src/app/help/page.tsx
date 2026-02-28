"use client";

import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Тусламжийн төв
          </h1>
          <p className="text-[13px] sm:text-base text-gray-600 mb-5 sm:mb-8">Танд хэрхэн туслах вэ?</p>

          {/* Quick Links */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
            <Link
              href="/faq"
              className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-3 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-[12px] sm:text-base">
                Түгээмэл асуулт
              </h3>
              <p className="text-[11px] sm:text-sm text-gray-500 hidden sm:block">
                Ихэвчлэн асуудаг асуултууд
              </p>
            </Link>

            <Link
              href="/tutorial"
              className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-3 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-[12px] sm:text-base">
                Заавар сургалт
              </h3>
              <p className="text-[11px] sm:text-sm text-gray-500 hidden sm:block">Алхам алхмаар заавар</p>
            </Link>

            <Link
              href="/terms"
              className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-3 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-[12px] sm:text-base">
                Нөхцөл журам
              </h3>
              <p className="text-[11px] sm:text-sm text-gray-500 hidden sm:block">Үйлчилгээний нөхцөл</p>
            </Link>
          </div>

          {/* Common Issues */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Түгээмэл асуудлууд
            </h2>

            <div className="space-y-4 sm:space-y-6">
              {[
                { title: "Захиалга үүсгэж чадахгүй байна", text: "Профайл хэсэгт нэр, утас, карго мэдээллээ оруулсан эсэхээ шалгаарай. Эдгээр мэдээлэл байхгүй бол захиалга үүсгэх боломжгүй." },
                { title: "Агенттай холбогдож чадахгүй байна", text: "Захиалгын дэлгэрэнгүй хэсэгт \"Чат\" товч дарж агенттай харилцах боломжтой. Хэрэв чат товч харагдахгүй бол захиалга цуцлагдсан эсвэл дууссан байж болно." },
                { title: "Төлбөр төлсөн ч баталгаажаагүй", text: "Төлбөр шилжүүлсний дараа \"Төлбөр төлсөн\" товч дарсан эсэхээ шалгаарай. Admin төлбөрийг баталгаажуулахад хэсэг хугацаа шаардагдаж болно." },
                { title: "Карго мэдээлэл өөрчлөх", text: "Профайл хэсэгт очиж карго мэдээллээ засах боломжтой. Гэхдээ аль хэдийн захиалсан барааны карго мэдээлэл өөрчлөгдөхгүй." },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-[13px] sm:text-base">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-[12px] sm:text-sm">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">
              Бидэнтэй холбогдох
            </h2>
            <p className="text-[13px] sm:text-base text-gray-600 mb-4 sm:mb-6">
              Дээрх мэдээллүүдээс шийдэл олсонгүй юу? Бидэнтэй шууд холбогдоорой.
            </p>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <a
                href="mailto:agentbuy.app@gmail.com"
                className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 hover:border-blue-400 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-[12px] sm:text-base">Имэйл</p>
                  <p className="text-[11px] sm:text-sm text-gray-500 truncate">
                    agentbuy.app@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+97685205258"
                className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 hover:border-blue-400 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-[12px] sm:text-base">Утас</p>
                  <p className="text-[11px] sm:text-sm text-gray-500">+976 8520-5258</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
