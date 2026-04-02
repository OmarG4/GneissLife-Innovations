"use client";

import { useMemo, useState } from "react";
import {
  Battery,
  CircleHelp,
  Cpu,
  Fan,
  Flame,
  Lightbulb,
  PlugZap,
  Router,
  Wifi,
} from "lucide-react";
import styles from "@/app/(app)/troubleshoot/troubleshoot.module.css";
import { troubleshootingCategories } from "@/lib/troubleshooting";

const categoryIcons = {
  power: PlugZap,
  sensors: Cpu,
  wifi: Wifi,
  mqtt: Router,
  fans: Fan,
  leds: Lightbulb,
  battery: Battery,
  general: Flame,
} as const;

export function TroubleshootingGuide() {
  const [activeCategoryId, setActiveCategoryId] = useState(troubleshootingCategories[0].id);
  const activeCategory = useMemo(
    () =>
      troubleshootingCategories.find((category) => category.id === activeCategoryId) ??
      troubleshootingCategories[0],
    [activeCategoryId],
  );

  return (
    <div className={styles.guide}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.sideLabel}>Problem categories</p>
          <div className={styles.categoryList}>
            {troubleshootingCategories.map((category) => {
              const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? CircleHelp;
              const isActive = category.id === activeCategory.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  className={isActive ? styles.categoryButtonActive : styles.categoryButton}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <Icon size={18} />
                  <span>{category.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className={styles.content}>
          <article className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <div>
                <p className={styles.sideLabel}>Selected category</p>
                <h2>{activeCategory.title}</h2>
              </div>
              <div className={styles.metaPills}>
                {activeCategory.tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </div>

            <p className={styles.overviewText}>{activeCategory.intro}</p>

            <div className={styles.callout}>
              <p className={styles.calloutLabel}>Best first step</p>
              <p>{activeCategory.firstStep}</p>
            </div>

            {activeCategory.expected?.length ? (
              <div className={styles.expectedList}>
                {activeCategory.expected.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </article>

          <div className={styles.issueGrid}>
            {activeCategory.issues.map((issue) => (
              <article key={issue.id} className={styles.issueCard}>
                <div className={styles.issueHeader}>
                  <h3>{issue.title}</h3>
                  <p>{issue.summary}</p>
                </div>

                <div className={styles.sectionBlock}>
                  <p className={styles.sectionLabel}>Checks</p>
                  <ul className={styles.checkList}>
                    {issue.checks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </div>

                {issue.notes?.length ? (
                  <div className={styles.noteBlock}>
                    <p className={styles.sectionLabel}>Notes</p>
                    <ul className={styles.noteList}>
                      {issue.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {issue.snippet ? (
                  <div className={styles.snippetBlock}>
                    <p className={styles.sectionLabel}>{issue.snippet.label}</p>
                    <pre className={styles.codeBlock}>
                      <code>{issue.snippet.code}</code>
                    </pre>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
