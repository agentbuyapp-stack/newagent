/**
 * Design System Constants
 * Minimal, calm, mobile-first design tokens
 */

export const colors = {
  // Backgrounds
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  // Borders
  border: {
    default: '#e2e8f0',
    light: '#f1f5f9',
    focus: '#60a5fa', // Soft blue
  },
  // Text
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
  },
  // Semantic colors (soft, muted)
  semantic: {
    primary: '#60a5fa', // Soft blue
    success: '#4ade80', // Soft green
    warning: '#fbbf24', // Muted yellow
    danger: '#f87171', // Soft red
  },
};

export const spacing = {
  xs: '0.5rem', // 8px
  sm: '0.75rem', // 12px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
};

export const borderRadius = {
  sm: '0.5rem', // rounded-lg
  md: '0.75rem', // rounded-xl
  lg: '1rem', // rounded-2xl
  full: '9999px',
};

// Reusable component styles
export const cardStyles = {
  base: 'bg-white border border-gray-200 rounded-xl',
  interactive: 'bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors',
};

export const buttonStyles = {
  primary: 'bg-blue-500 text-white rounded-xl px-4 py-2.5 min-h-[44px] font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-white border border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 min-h-[44px] font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors',
  danger: 'bg-red-500 text-white rounded-xl px-4 py-2.5 min-h-[44px] font-medium hover:bg-red-600 active:bg-red-700 transition-colors',
  success: 'bg-green-500 text-white rounded-xl px-4 py-2.5 min-h-[44px] font-medium hover:bg-green-600 active:bg-green-700 transition-colors',
};

export const inputStyles = {
  base: 'w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
  error: 'w-full px-4 py-3 text-base text-black bg-white border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500',
};

export const tabStyles = {
  base: 'px-4 py-2.5 text-sm font-medium text-gray-600 rounded-lg transition-colors',
  active: 'px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg',
};

export const badgeStyles = {
  default: 'px-2.5 py-1 text-xs font-medium rounded-full',
  success: 'px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
  warning: 'px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
  danger: 'px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
  info: 'px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
};

