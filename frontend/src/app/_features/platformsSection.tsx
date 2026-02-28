const platforms = [
  {
    name: "Taobao",
    description: "Хятадын хамгийн том онлайн худалдааны платформ",
    img: "/taobao.png",
    color: "from-orange-50 to-red-50",
    borderColor: "border-orange-200/60",
  },
  {
    name: "1688 / Alibaba",
    description: "Бөөний худалдааны платформ, хямд үнэтэй",
    img: "/alibaba.png",
    color: "from-amber-50 to-yellow-50",
    borderColor: "border-amber-200/60",
  },
  {
    name: "Pinduoduo",
    description: "Хямдралтай бараа, групп худалдан авалт",
    img: "/pinduoduo-stock-e-commerce-1609177441009.webp",
    color: "from-red-50 to-pink-50",
    borderColor: "border-red-200/60",
  },
  {
    name: "Poizon / Dewu",
    description: "Брэнд бараа, гутал, хувцасны платформ",
    img: "/Dewu-Poizon-E-Commerce-1024x576.jpg",
    color: "from-gray-50 to-slate-50",
    borderColor: "border-gray-200/60",
  },
];

export const PlatformsSection = () => {
  return (
    <section id="platforms" className="py-12 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Дэмжигдсэн платформууд
          </h2>
          <p className="mt-2.5 sm:mt-4 text-gray-500 text-[13px] sm:text-base max-w-2xl mx-auto">
            Хятадын шилдэг e-commerce платформуудаас шууд захиалга өгөх боломжтой
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className={`group bg-gradient-to-br ${platform.color} border ${platform.borderColor} rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img src={platform.img} alt={platform.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-[13px] sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
                {platform.name}
              </h3>
              <p className="text-[11px] sm:text-sm text-gray-500 leading-relaxed">
                {platform.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
