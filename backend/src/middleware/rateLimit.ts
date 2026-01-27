import rateLimit from "express-rate-limit";

// Ерөнхий API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 15 минутад 100 хүсэлт
  message: { error: "Хэт олон хүсэлт илгээлээ. Түр хүлээнэ үү." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints-д илүү хатуу limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // 15 минутад 20 хүсэлт
  message: { error: "Хэт олон нэвтрэх оролдлого. 15 минут хүлээнэ үү." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Захиалга үүсгэхэд limiter
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 цаг
  max: 30, // 1 цагт 30 захиалга
  message: { error: "Хэт олон захиалга үүсгэлээ. 1 цаг хүлээнэ үү." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Мессеж илгээхэд limiter
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минут
  max: 30, // 1 минутад 30 мессеж
  message: { error: "Хэт олон мессеж илгээлээ. Түр хүлээнэ үү." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Зураг upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 цаг
  max: 50, // 1 цагт 50 зураг
  message: { error: "Хэт олон зураг оруулалт. 1 цаг хүлээнэ үү." },
  standardHeaders: true,
  legacyHeaders: false,
});
