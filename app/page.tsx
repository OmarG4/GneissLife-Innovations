import styles from "./page.module.css";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/readings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboardData = await getDashboardData();

  return (
    <main className={styles.page}>
      <DashboardShell initialData={dashboardData} />
    </main>
  );
}
