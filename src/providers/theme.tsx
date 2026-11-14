import { useEffect, useState, type ReactNode } from "react";
import { STUDIO_THEMES, type StudioThemeId } from "@/config/studio.config";
import { StudioThemeContext } from "@/hooks/useStudioTheme";

const STORAGE_KEY = "ecd_studio_theme";

function readStoredThemeId(): StudioThemeId {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && raw in STUDIO_THEMES) {
      return raw as StudioThemeId;
    }
  } catch {
    // Ignore storage read failures in restricted contexts
  }
  return "mondrian";
}

function applyThemeToDocument(themeId: StudioThemeId) {
  const preset = STUDIO_THEMES[themeId];
  const root = document.documentElement;
  root.setAttribute("data-studio-theme", themeId);
  root.style.setProperty("--studio-red", preset.red);
  root.style.setProperty("--studio-blue", preset.blue);
  root.style.setProperty("--studio-yellow", preset.yellow);
  root.style.setProperty("--studio-canvas", preset.canvas);
  root.style.setProperty("--studio-surface", preset.surface);
  root.style.setProperty("--studio-ink", preset.ink);
}

export function StudioThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<StudioThemeId>(readStoredThemeId);

  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  const setThemeId = (nextId: StudioThemeId) => {
    setThemeIdState(nextId);
    applyThemeToDocument(nextId);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextId);
    } catch {
      // Ignore storage write failures
    }
  };

  return (
    <StudioThemeContext.Provider
      value={{
        themeId,
        theme: STUDIO_THEMES[themeId],
        setThemeId,
      }}
    >
      {children}
    </StudioThemeContext.Provider>
  );
}
