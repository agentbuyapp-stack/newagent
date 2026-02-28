const steps = [
  {
    num: "01",
    title: "Бараа мэдээлэл оруулах",
    description: "Хүссэн барааныхаа мэдээллийг оруулж захиалга үүсгэнэ",
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Тайлан харж, төлбөр төлөх",
    description: "Агент барааг судалж тайлан илгээнэ. Судалгаа таалагдвал заасан дансанд төлбөрөө шилжүүлнэ",
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Каргоноос авах",
    description: "Бараа Монголд ирэхэд сонгосон каргоноосоо бараагаа авна",
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Хэрхэн ажилладаг вэ?
          </h2>
          <p className="mt-2.5 sm:mt-4 text-gray-500 text-[13px] sm:text-base max-w-2xl mx-auto">
            Ердөө 3 энгийн алхамаар хүссэн бараагаа захиалаарай
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 relative">
          <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />

          {steps.map((step) => (
            <div key={step.num} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4 sm:mb-6">
                {step.icon}
              </div>

              <div className="absolute top-0 right-1/2 translate-x-9 sm:translate-x-12 -translate-y-1 bg-white border-2 border-blue-500 text-blue-600 text-[10px] sm:text-xs font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-sm z-20">
                {step.num}
              </div>

              <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-3">
                {step.title}
              </h3>
              <p className="text-[13px] sm:text-base text-gray-500 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
