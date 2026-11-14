import { createContext, useContext } from "react";
import type { StudioThemeId, StudioThemePreset } from "@/config/studio.config";

export interface StudioThemeContextValue {
  themeId: StudioThemeId;
  theme: StudioThemePreset;
  setThemeId: (id: StudioThemeId) => void;
}

export const StudioThemeContext =
  createContext<StudioThemeContextValue | null>(null);

export function useStudioTheme(): StudioThemeContextValue {
  const ctx = useContext(StudioThemeContext);
  if (!ctx) {
    throw new Error("useStudioTheme must be used within StudioThemeProvider");
  }
  return ctx;
}
