export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Accepts phone numbers with digits, spaces, dashes, parentheses, and + sign
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 8;
};

export const validateName = (name: string): boolean => {
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= 100;
};

