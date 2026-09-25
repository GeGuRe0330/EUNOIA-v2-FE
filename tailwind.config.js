/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Vite의 루트 HTML 파일
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#FCEEDC", // 부드러운 베이지
          DEFAULT: "#E6CFC1", // 따뜻한 톤의 살구색
          dark: "#B08968", // 짙은 우드 브라운
        },
        secondary: {
          light: "#D8F3DC", // 연한 민트
          DEFAULT: "#95D5B2", // 자연 느낌의 초록
          dark: "#52B788", // 더 짙은 자연의 녹색
        },
        accent: "#FFD6E0", // 부드러운 핑크 (감성 포인트)
        background: "#FAF3E0", // 종이 질감 느낌 배경
        surface: "#FFF9F0", // 카드 배경 (off-white)
        textPrimary: "#5C3A21", // 잉크 브라운 느낌
        textSecondary: "#7F5539",
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', '"Inter"', "sans-serif"],
        serif: ['"Cormorant Garamond"', "serif"],
        handwriting: ["NanumNaMuJeongWeon", "serif"],
      },
    },
  },
  plugins: [],
};
