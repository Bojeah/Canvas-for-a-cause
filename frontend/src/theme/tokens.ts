export const THEME = {
  colors: {
    action: {
      primaryMain: "#0c3d91",
      primaryHover: "#0a3277",
      primaryActive: "#08285d",
    },
    light: {
      bg: "white",
      bgSecondary: "#fafafa",
      text: "#171717",
      textSecondary: "#525252",
      border: "#e5e5e5",
      borderLight: "#f0f0f0",
    },
    dark: {
      bg: "#0a0a0a",
      bgSecondary: "#171717",
      text: "#fafafa",
      textSecondary: "#a3a3a3",
      border: "#262626",
      borderLight: "#1f1f1f",
    },
    brand: {
      navy: "#0d47a1",
      navyDark: "#051c43",
      black: "#000000",
      white: "#ffffff",
    },
    status: {
      success: "#059669",
      error: "#dc2626",
      warning: "#d97706",
      info: "#0d47a1",
    },
  },
  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
  },
  sizing: {
    buttonMd: {
      px: "1rem",
      py: "0.5rem",
      minHeight: "2.5rem",
    },
    buttonLg: {
      px: "1.5rem",
      py: "0.75rem",
      minHeight: "3rem",
    },
    input: {
      px: "1rem",
      py: "0.75rem",
      minHeight: "2.75rem",
    },
  },
  transitions: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
  },
} as const;
