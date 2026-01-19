export default function AdminLoading() {
  return (
    <div className="fixed inset-0 bg-linear-to-br from-[#F0E8FF] via-[#F5F0FF] to-[#EEE8FF] flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-400/25 rounded-full blur-3xl animate-blob" />
      <div className="absolute -top-20 right-10 w-72 h-72 bg-indigo-400/25 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-10 right-20 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

      <div className="flex flex-col items-center gap-8 z-10">
        {/* Admin icon with animated rings */}
        <div className="relative animate-fade-in">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 w-28 h-28 rounded-full border-4 border-[#8b5cf6]/20 animate-ping" style={{ animationDuration: '2s' }} />

          {/* Middle rotating ring */}
          <svg className="absolute -inset-2 w-32 h-32 animate-spin-slow" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="adminGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#adminGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="60 200"
            />
          </svg>

          {/* Icon container */}
          <div className="relative w-28 h-28 rounded-full bg-linear-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-2xl shadow-purple-500/40">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#6366f1] to-[#8b5cf6]">
            Админ
          </h2>

          <div className="flex items-center gap-3 text-gray-600 font-medium">
            <span>Ачааллаж байна</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#6366f1] rounded-full animate-bounce-dot" />
              <span className="w-2.5 h-2.5 bg-[#8b5cf6] rounded-full animate-bounce-dot animation-delay-150" />
              <span className="w-2.5 h-2.5 bg-[#a78bfa] rounded-full animate-bounce-dot animation-delay-300" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden animate-fade-in-up animation-delay-500">
          <div className="h-full bg-linear-to-r from-[#6366f1] to-[#8b5cf6] rounded-full animate-progress-bar" />
        </div>
      </div>
    </div>
  );
}
