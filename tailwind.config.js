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
      // 로딩 화면 문구 전환용 — CSS 키프레임(끝값 유지)이라 JS 애니메이션 라이브러리의 마무리 전환 때 한 프레임 깜빡이는 현상이 없음
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        // 0 → 1 → 유지 → 0 (한 문장이 머무는 동안). 총 시간은 요소의 animationDuration으로 지정
        "message-fade": {
          "0%": { opacity: "0" },
          "22%": { opacity: "1" },
          "78%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 1.2s ease-out forwards",
        "fade-out": "fade-out 0.6s ease-in forwards",
        "message-fade": "message-fade 5.4s ease-in-out forwards",
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
