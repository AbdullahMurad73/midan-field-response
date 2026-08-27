/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',    // كحلي غامق فخم للخلفيات
          card: '#1e293b',    // لون الكروت والبطاقات
          primary: '#3b82f6', // الأزرق اللامع للأزرار
          success: '#10b981', // الأخضر للطلبات المكتملة
          warning: '#f59e0b', // البرتقالي للطلبات المنتظرة
          danger: '#ef4444',  // الأحمر للطوارئ الصحوية
        }
      }
    },
  },
  plugins: [],
}