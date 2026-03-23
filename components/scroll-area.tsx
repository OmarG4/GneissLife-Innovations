"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";
import styles from "./scroll-area.module.css";

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
};

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={joinClasses(styles.root, className)}>
      <ScrollAreaPrimitive.Viewport
        className={joinClasses(styles.viewport, viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollAreaPrimitive.Scrollbar className={styles.scrollbar} orientation="horizontal">
        <ScrollAreaPrimitive.Thumb className={styles.thumb} />
      </ScrollAreaPrimitive.Scrollbar>

      <ScrollAreaPrimitive.Scrollbar className={styles.scrollbar} orientation="vertical">
        <ScrollAreaPrimitive.Thumb className={styles.thumb} />
      </ScrollAreaPrimitive.Scrollbar>

      <ScrollAreaPrimitive.Corner className={styles.corner} />
    </ScrollAreaPrimitive.Root>
  );
}
