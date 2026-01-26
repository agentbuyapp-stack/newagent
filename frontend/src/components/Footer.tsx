"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/icon.png" alt="AgentBuy" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-bold">AgentBuy</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Хятадаас бараа захиалах хамгийн хялбар арга
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 hover:bg-black rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Бидний тухай */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Бидний тухай</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Бидний тухай
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Үйлчилгээний нөхцөл
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Нууцлалын бодлого
                </Link>
              </li>
            </ul>
          </div>

          {/* Асуулт хариулт */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Асуулт хариулт</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Түгээмэл асуулт
                </Link>
              </li>
              <li>
                <Link href="/tutorial" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Заавар сургалт
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Тусламжийн төв
                </Link>
              </li>
            </ul>
          </div>

          {/* Холбоо барих */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Холбоо барих</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:agentbuy.app@gmail.com" className="hover:text-white transition-colors">
                  agentbuy.app@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+97685205258" className="hover:text-white transition-colors">
                  +976 8520-5258
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Дархан-Уул аймаг, Монгол</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} AgentBuy. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <p className="text-gray-600 text-xs">
              POWERED BY <span className="text-blue-400 font-semibold">DARKHAN BUSIIN CARGO</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
