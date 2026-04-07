export const themeOptions = [
  {
    id: "oak",
    label: "Oak / Walnut / Mahogany",
    description: "Grounding, stability, and a deeper nature connection.",
    swatches: ["#a17650", "#6b4a33", "#8a4c39"],
    glow: "rgba(161, 118, 80, 0.18)",
    wash: "linear-gradient(135deg, rgba(255, 247, 239, 0.98), rgba(244, 233, 220, 0.92))",
  },
  {
    id: "smokey",
    label: "Smokey Quartz",
    description: "Protection, neutrality, and a sleek modern edge.",
    swatches: ["#4b5563", "#1f2937", "#b4bcc8"],
    glow: "rgba(71, 85, 105, 0.18)",
    wash: "linear-gradient(135deg, rgba(250, 251, 252, 0.98), rgba(232, 237, 242, 0.94))",
  },
  {
    id: "copper",
    label: "Copper & Azurite",
    description: "Energy and intuition with vitality balanced by calm.",
    swatches: ["#c76a1d", "#2563eb", "#0f766e"],
    glow: "rgba(37, 99, 235, 0.18)",
    wash: "linear-gradient(135deg, rgba(255, 247, 239, 0.98), rgba(230, 241, 255, 0.94))",
  },
  {
    id: "sage",
    label: "Sage & Lavender",
    description: "Growth, renewal, and a softer spiritual lift.",
    swatches: ["#6b8f71", "#8b5cf6", "#c4b5fd"],
    glow: "rgba(139, 92, 246, 0.18)",
    wash: "linear-gradient(135deg, rgba(247, 252, 246, 0.98), rgba(238, 232, 255, 0.94))",
  },
  {
    id: "quartz",
    label: "Milky Quartz & Stibnite",
    description: "Clarity and grounding with a bright light-and-shadow balance.",
    swatches: ["#f3f4f6", "#a0aec0", "#1f2937"],
    glow: "rgba(100, 116, 139, 0.18)",
    wash: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(236, 241, 246, 0.94))",
  },
] as const;

export const DEFAULT_THEME = "oak";
export const THEME_STORAGE_KEY = "metatron-theme";

export type ThemeId = (typeof themeOptions)[number]["id"];

export const themeIds = themeOptions.map((theme) => theme.id);

const themeIdSet = new Set<ThemeId>(themeIds);

export const isThemeId = (value: string): value is ThemeId => themeIdSet.has(value as ThemeId);

export const getInitialTheme = (): ThemeId => {
  if (typeof document !== "undefined") {
    const currentTheme = document.documentElement.dataset.theme;

    if (currentTheme && isThemeId(currentTheme)) {
      return currentTheme;
    }
  }

  if (typeof window !== "undefined") {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme && isThemeId(storedTheme)) {
      return storedTheme;
    }
  }

  return DEFAULT_THEME;
};
