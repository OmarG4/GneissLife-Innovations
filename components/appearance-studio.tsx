"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import styles from "@/app/(app)/appearance/appearance.module.css";
import {
  getInitialTheme,
  THEME_STORAGE_KEY,
  themeOptions,
  type ThemeId,
} from "@/lib/theme-options";

export function AppearanceStudio() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
  }, [activeTheme]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerBadge}>
          <Palette size={16} />
          <span>Appearance</span>
        </div>

        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Theme Control</p>
          <h1>Choose a theme</h1>
          <p className={styles.headerDescription}>
            Keep the interface light while changing the accent mood across the app.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {themeOptions.map((theme) => {
          const isActive = theme.id === activeTheme;

          return (
            <button
              key={theme.id}
              type="button"
              className={isActive ? styles.optionActive : styles.option}
              onClick={() => setActiveTheme(theme.id)}
              aria-pressed={isActive}
            >
              <div className={styles.optionTop}>
                <div>
                  <p className={styles.optionEyebrow}>Palette</p>
                  <h2>{theme.label}</h2>
                </div>

                {isActive ? (
                  <span className={styles.optionBadge}>
                    <Check size={14} />
                    Active
                  </span>
                ) : null}
              </div>

              <p className={styles.optionDescription}>{theme.description}</p>

              <div className={styles.optionFooter}>
                <div className={styles.optionSwatches} aria-hidden="true">
                  {theme.swatches.map((color) => (
                    <span
                      key={`${theme.id}-${color}`}
                      className={styles.optionSwatch}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <span className={styles.optionHint}>{isActive ? "Applied" : "Tap to apply"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
