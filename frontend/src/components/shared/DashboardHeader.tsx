"use client";

interface DashboardHeaderProps {
  title: string;
  primaryColor: string;
  secondaryColor: string;
  icon: React.ReactNode;
  onSignOut: () => void;
}

export function DashboardHeader({
  title,
  primaryColor,
  secondaryColor,
  icon,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              {icon}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">
              {title}
            </h1>
          </div>
          <button
            onClick={onSignOut}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-colors font-medium shrink-0"
          >
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}
