import styles from "@/app/page.module.css";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/readings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboardData = await getDashboardData();
  const latestDeviceId = dashboardData.readings[0]?.device_id ?? "metatron_001";
  const devices = [
    {
      id: latestDeviceId,
      name: "Metatron Demo Device",
      status:
        dashboardData.source === "live"
          ? "Connected via DynamoDB feed"
          : "Using mock telemetry feed",
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.dashboardStack}>
        <DashboardShell initialData={dashboardData} devices={devices} />
      </div>
    </main>
  );
}
