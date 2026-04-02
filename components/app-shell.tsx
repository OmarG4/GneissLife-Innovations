"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  LayoutDashboard,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
} from "lucide-react";
import styles from "@/components/app-shell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

const navigationItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/troubleshoot", label: "Troubleshoot", icon: CircleHelp },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const syncSidebarState = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    syncSidebarState();
    mediaQuery.addEventListener("change", syncSidebarState);

    return () => mediaQuery.removeEventListener("change", syncSidebarState);
  }, []);

  const desktopCollapsed = !sidebarOpen && !isMobile;

  return (
    <div className={desktopCollapsed ? styles.frameCollapsed : styles.frame}>
      {sidebarOpen && isMobile ? (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      <aside
        className={
          sidebarOpen ? styles.sidebarOpen : isMobile ? styles.sidebarClosed : styles.sidebarRail
        }
      >
        <div className={styles.sidebarHeader}>
          <button
            type="button"
            className={styles.globalToggle}
            onClick={() => setSidebarOpen((open) => !open)}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <div className={styles.brandBlock}>
          {!desktopCollapsed ? (
            <>
              <p className={styles.eyebrow}>Metatron</p>
              <h1 className={styles.brandTitle}>Control Center</h1>
            </>
          ) : null}
        </div>

        <nav className={styles.nav}>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? styles.navLinkActive : styles.navLink}
                title={desktopCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!desktopCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.authButton}
            title={desktopCollapsed ? "Sign in" : undefined}
          >
            <LogIn size={16} />
            {!desktopCollapsed ? <span>Sign in</span> : null}
          </button>

          <button
            type="button"
            className={styles.authButton}
            title={desktopCollapsed ? "Sign up" : undefined}
          >
            <UserPlus size={16} />
            {!desktopCollapsed ? <span>Sign up</span> : null}
          </button>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
