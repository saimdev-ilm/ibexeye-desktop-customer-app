/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      rotate: {
        'y-180': '180deg',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'hidden': 'hidden',
      },
      animation: {
        "dot-bounce": "dot-bounce 1.2s infinite",
      },
      keyframes: {
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      },
      colors: {
        theme: {
          dark: "#2D2D34", // Dark background color
          light: "#F5F6FA", // Light background color
        },
        textTheme: {
          light: "#000000", // Light text color
          dark: "#ffffff", // Dark text color
        },
        customBlue: "#1B3C55",
        customBlueHover: "#1B3C55",
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        hd: "1366px",
        "2xl": "1536px",
        "3xl": "1920px",
        "4k": "2560px",
        "2k-scaled": "1615px", // New screen size for 200% scaled resolution
      },
      fontSize: {
        xls: ["10px", { lineHeight: "1.5" }],
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }], // Default font size
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.5" }],
        "2xl": ["24px", { lineHeight: "1.5" }],
        hd: ["28px", { lineHeight: "1.6" }], // For HD (1366px)
        fhd: ["32px", { lineHeight: "1.6" }], // For Full HD (1920px)
        "4k": ["40px", { lineHeight: "1.8" }], // For 4K screens
        "2k-scaled": ["36px", { lineHeight: "1.7" }], // Font size for 2k-scaled
      },
      fontFamily: {
        sans: ["Roboto", "Arial", "sans-serif"], // Default font family
        heading: ["Poppins", "sans-serif"], // Custom font for headings
        mono: ["Courier New", "monospace"], // Monospace font
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
