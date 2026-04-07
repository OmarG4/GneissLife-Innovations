"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  LayoutDashboard,
  LogIn,
  Palette,
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
  { href: "/appearance", label: "Appearance", icon: Palette },
  { href: "/troubleshoot", label: "Troubleshoot", icon: CircleHelp },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const syncSidebarState = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    syncSidebarState();
    mediaQuery.addEventListener("change", syncSidebarState);

    return () => mediaQuery.removeEventListener("change", syncSidebarState);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.overflow = isMobile && mobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, mobileSidebarOpen]);

  const sidebarOpen = isMobile ? mobileSidebarOpen : desktopSidebarOpen;
  const desktopCollapsed = !desktopSidebarOpen && !isMobile;
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((open) => !open);
      return;
    }

    setDesktopSidebarOpen((open) => !open);
  };

  return (
    <div className={desktopCollapsed ? styles.frameCollapsed : styles.frame}>
      {isMobile ? (
        <div className={styles.mobileTopBar}>
          <button
            type="button"
            className={styles.mobileMenuTrigger}
            onClick={toggleSidebar}
            aria-expanded={mobileSidebarOpen}
            aria-controls="control-center-sidebar"
            aria-label={mobileSidebarOpen ? "Close Control Center" : "Open Control Center"}
          >
            {mobileSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            <span>Control Center</span>
          </button>
        </div>
      ) : null}

      {sidebarOpen && isMobile ? (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      <aside
        id="control-center-sidebar"
        className={
          sidebarOpen ? styles.sidebarOpen : isMobile ? styles.sidebarClosed : styles.sidebarRail
        }
      >
        <div className={styles.sidebarHeader}>
          <button
            type="button"
            className={styles.globalToggle}
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Collapse Control Center" : "Expand Control Center"}
            aria-controls="control-center-sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <div className={styles.brandBlock}>
          {!desktopCollapsed ? (
            <>
              <p className={styles.eyebrow}>Metatron</p>
              <h1 className={styles.brandTitle}>Control Center</h1>
              <p className={styles.brandNote}>
                Device controls, appearance settings, and system routes.
              </p>
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
                onClick={() => {
                  if (isMobile) {
                    setMobileSidebarOpen(false);
                  }
                }}
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
