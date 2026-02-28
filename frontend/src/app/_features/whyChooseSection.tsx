import { type ReactNode } from "react";

const features: { title: string; description: string; icon: ReactNode; iconColor: string; bgColor: string }[] = [
  {
    title: "Найдвартай агентууд",
    description: "Туршлагатай, хятад хэлтэй агенттай хамтран захиалга хийх боломж",
    icon: <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Хурдан хүргэлт",
    description: "Хамтран ажиллагч карго компаниудтай уялдан ажилладаг",
    icon: <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Төлбөрийн хялбар шийдэл",
    description: "Хэрэглэгч зөвхөн админий монгол дансанд төгрөгөөр шилжүүлэг хийхэд хангалттай",
    icon: <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "24/7 Дэмжлэг",
    description: "Оператор болон хиймэл оюун хослосон чат, 24/7 холбогдох боломжтой",
    icon: <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export const WhyChooseSection = () => {
  return (
    <section className="py-12 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Яагаад AgentBuy гэж?
          </h2>
          <p className="mt-2.5 sm:mt-4 text-gray-500 text-[13px] sm:text-base max-w-2xl mx-auto">
            Бид таны худалдан авалтыг аюулгүй, хялбар, хурдан болгоно
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {features.map((feature) => (
            <div key={feature.title}
              className="group relative bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-11 h-11 sm:w-14 sm:h-14 ${feature.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform`}>
                <div className={feature.iconColor}>{feature.icon}</div>
              </div>
              <h3 className="text-[13px] sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-[11px] sm:text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
