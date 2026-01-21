"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Content */}
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Тусламжийн төв
          </h1>
          <p className="text-gray-600 mb-8">Танд хэрхэн туслах вэ?</p>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Link
              href="/faq"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-blue-600"
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
              <h3 className="font-semibold text-gray-900 mb-1">
                Түгээмэл асуулт
              </h3>
              <p className="text-sm text-gray-500">
                Ихэвчлэн асуудаг асуултууд
              </p>
            </Link>

            <Link
              href="/tutorial"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-green-600"
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
              <h3 className="font-semibold text-gray-900 mb-1">
                Заавар сургалт
              </h3>
              <p className="text-sm text-gray-500">Алхам алхмаар заавар</p>
            </Link>

            <Link
              href="/terms"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-purple-600"
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
              <h3 className="font-semibold text-gray-900 mb-1">
                Үйлчилгээний нөхцөл
              </h3>
              <p className="text-sm text-gray-500">Нөхцөл, журам</p>
            </Link>
          </div>

          {/* Common Issues */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Түгээмэл асуудлууд
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Захиалга үүсгэж чадахгүй байна
                </h3>
                <p className="text-gray-600 text-sm">
                  Профайл хэсэгт нэр, утас, карго мэдээллээ оруулсан эсэхээ
                  шалгаарай. Эдгээр мэдээлэл байхгүй бол захиалга үүсгэх
                  боломжгүй.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Агенттай холбогдож чадахгүй байна
                </h3>
                <p className="text-gray-600 text-sm">
                  Захиалгын дэлгэрэнгүй хэсэгт &quot;Чат&quot; товч дарж
                  агенттай харилцах боломжтой. Хэрэв чат товч харагдахгүй бол
                  захиалга цуцлагдсан эсвэл дууссан байж болно.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Төлбөр төлсөн ч баталгаажаагүй
                </h3>
                <p className="text-gray-600 text-sm">
                  Төлбөр шилжүүлсний дараа &quot;Төлбөр төлсөн&quot; товч дарсан
                  эсэхээ шалгаарай. Admin төлбөрийг баталгаажуулахад хэсэг
                  хугацаа шаардагдаж болно.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Карго мэдээлэл өөрчлөх
                </h3>
                <p className="text-gray-600 text-sm">
                  Профайл хэсэгт очиж карго мэдээллээ засах боломжтой. Гэхдээ
                  аль хэдийн захиалсан барааны карго мэдээлэл өөрчлөгдөхгүй.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Бидэнтэй холбогдох
            </h2>
            <p className="text-gray-600 mb-6">
              Дээрх мэдээллүүдээс шийдэл олсонгүй юу? Бидэнтэй шууд
              холбогдоорой.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="mailto:info@agentbuy.mn"
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                <div>
                  <p className="font-medium text-gray-900">Имэйл</p>
                  <p className="text-sm text-gray-500">
                    agentbuy.app@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+976 85205258"
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                  <p className="font-medium text-gray-900">Утас</p>
                  <p className="text-sm text-gray-500">+976 8520-5258</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
