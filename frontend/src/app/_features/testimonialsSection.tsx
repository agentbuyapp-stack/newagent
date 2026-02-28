const testimonials = [
  {
    name: "Батбаяр Б.",
    role: "Байнгын хэрэглэгч",
    text: "Taobao-аас гутал захиалсан. Агент маш хурдан хариулсан, бараа 2 долоо хоногт ирсэн. Маш сэтгэл хангалуун!",
    rating: 5,
  },
  {
    name: "Сарангэрэл О.",
    role: "Шинэ хэрэглэгч",
    text: "Анх удаа ашигласан ч маш хялбар байсан. Линкээ оруулаад л хүлээхэд болно. Агент бүх зүйлийг зохицуулсан.",
    rating: 5,
  },
  {
    name: "Ганбат Д.",
    role: "Бизнес хэрэглэгч",
    text: "1688-аас бөөнөөр бараа авдаг. AgentBuy-ийн агентууд найдвартай, үнэ тооцоо ил тод. Бизнест маш тохиромжтой.",
    rating: 5,
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${i < rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-12 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Хэрэглэгчдийн сэтгэгдэл
          </h2>
          <p className="mt-2.5 sm:mt-4 text-gray-500 text-[13px] sm:text-base max-w-2xl mx-auto">
            Манай хэрэглэгчид юу гэж хэлж байна вэ?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {testimonials.map((t) => (
            <div key={t.name}
              className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-100 mb-3 sm:mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10H0z" />
              </svg>

              <StarRating rating={t.rating} />

              <p className="mt-3 sm:mt-4 text-[13px] sm:text-base text-gray-600 leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[13px] sm:text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[13px] sm:text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-[11px] sm:text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
