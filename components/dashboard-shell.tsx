"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import styles from "@/app/page.module.css";
import { ScrollArea } from "@/components/scroll-area";
import type { DashboardResponse, DeviceReading } from "@/lib/types";

type DashboardShellProps = {
  initialData: DashboardResponse;
};

const metricCards = [
  { key: "temperature", label: "Temperature", unit: "C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "iaq", label: "IAQ", unit: "" },
  { key: "voc_index", label: "VOC Index", unit: "" },
] as const;

const formatMetricValue = (value: number, unit: string) => {
  const formatted =
    unit === "" ? value.toFixed(0) : value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);

  return `${formatted}${unit ? ` ${unit}` : ""}`;
};

const formatTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));

const subscribeToViewport = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const getViewportWidth = () => window.innerWidth;
const getServerViewportWidth = () => 1280;

const formatChartTimestamp = (timestamp: string, compact: boolean) =>
  new Intl.DateTimeFormat("en-US", {
    month: compact ? undefined : "short",
    day: compact ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: compact ? "2-digit" : undefined,
  }).format(new Date(timestamp));

const chartSeries = {
  temperature: { label: "Temperature", color: "#f59e0b", unit: "C" },
  humidity: { label: "Humidity", color: "#0f766e", unit: "%" },
  iaq: { label: "IAQ", color: "#2563eb", unit: "" },
  voc_index: { label: "VOC Index", color: "#b45309", unit: "" },
  mold_risk_score: { label: "Mold Risk", color: "#7c3aed", unit: "" },
} as const;

type SeriesKey = keyof typeof chartSeries;

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: readonly Payload<ValueType, NameType>[];
};

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>
        {typeof label === "string" ? formatTimestamp(label) : ""}
      </p>

      <div className={styles.chartTooltipList}>
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? "") as SeriesKey;
          const config = chartSeries[key];

          if (!config) {
            return null;
          }

          const numericValue =
            typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);

          return (
            <div className={styles.chartTooltipRow} key={`${entry.dataKey}-${entry.name}`}>
              <div className={styles.chartTooltipSeries}>
                <span
                  className={styles.chartTooltipDot}
                  style={{ backgroundColor: config.color }}
                />
                <span className={styles.chartTooltipName}>{config.label}</span>
              </div>

              <span className={styles.chartTooltipValue}>
                {formatMetricValue(numericValue, config.unit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getAverage = (rows: DeviceReading[], metric: keyof DeviceReading) => {
  if (rows.length === 0) {
    return 0;
  }

  const total = rows.reduce((sum, row) => sum + Number(row[metric] ?? 0), 0);
  return total / rows.length;
};

const getBatteryLevelWidth = (value: number | undefined) => {
  const safeValue = Math.max(0, Math.min(100, Number(value ?? 0)));
  return `${safeValue}%`;
};

export function DashboardShell({ initialData }: DashboardShellProps) {
  const [data, setData] = useState(initialData);
  const chartsReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const viewportWidth = useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth,
  );
  const [isPending, startTransition] = useTransition();
  const isCompactChart = viewportWidth < 640;
  const chartMinHeight = isCompactChart ? 260 : 320;
  const chartMargin = isCompactChart
    ? { top: 8, right: 6, bottom: 8, left: 0 }
    : { top: 8, right: 12, bottom: 8, left: 4 };

  const latest = data.readings[0];
  const averages = {
    temperature: getAverage(data.readings, "temperature"),
    humidity: getAverage(data.readings, "humidity"),
    iaq: getAverage(data.readings, "iaq"),
    voc_index: getAverage(data.readings, "voc_index"),
    mold_risk_score: getAverage(data.readings, "mold_risk_score"),
  };

  const refreshData = () => {
    startTransition(async () => {
      const response = await fetch("/api/readings", { cache: "no-store" });
      const next = (await response.json()) as DashboardResponse;
      setData(next);
    });
  };

  return (
    <section className={styles.shell}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Metatron Telemetry</p>
          <h1 className={styles.title}>Metatron Telemetry</h1>
          <p className={styles.subtitle}>
            Track battery, air quality, mold risk, temperature, humidity, and fan
            behavior from a Next.js dashboard. Live data is pulled server-side from the
            `metatron_device_data` DynamoDB table when AWS credentials are configured.
          </p>
        </div>

        <div className={styles.heroActions}>
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Data source</span>
                <strong>{data.source === "live" ? "AWS DynamoDB" : "Mock sample data"}</strong>
              </div>

              <div className={styles.batteryStatus}>
                <span className={styles.batteryPercent}>
                  {latest ? formatMetricValue(latest.battery_percentage, "%") : "--"}
                </span>
                <span className={styles.batteryIcon} aria-hidden="true">
                  <span className={styles.batteryIconCap} />
                  <span className={styles.batteryIconBody}>
                    <span
                      className={styles.batteryIconLevel}
                      style={{ width: getBatteryLevelWidth(latest?.battery_percentage) }}
                    />
                  </span>
                </span>
              </div>
            </div>
            <span className={styles.statusHint}>{data.message}</span>
          </div>

          <button className={styles.refreshButton} onClick={refreshData} disabled={isPending}>
            {isPending ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </div>

      <article className={styles.moldRiskBanner}>
        <div>
          <p className={styles.panelEyebrow}>Primary Signal</p>
          <h2>Mold risk score</h2>
        </div>
        <strong className={styles.moldRiskBannerValue}>
          {latest ? formatMetricValue(latest.mold_risk_score, "") : "--"}
        </strong>
        <span className={styles.moldRiskBannerMeta}>
          Avg {formatMetricValue(averages.mold_risk_score, "")} across recent readings
        </span>
      </article>

      <div className={styles.metricGrid}>
        {metricCards.map((card) => (
          <article className={styles.metricCard} key={card.key}>
            <span className={styles.metricLabel}>{card.label}</span>
            <strong className={styles.metricValue}>
              {latest ? formatMetricValue(Number(latest[card.key]), card.unit) : "--"}
            </strong>
            <span className={styles.metricSubtle}>
              Avg {formatMetricValue(averages[card.key], card.unit)}
            </span>
          </article>
        ))}
      </div>

      <div className={styles.chartGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Thermals</p>
              <h2>Temperature trend</h2>
            </div>
            <span>{data.readings.length} recent readings</span>
          </div>
          <div className={styles.chartWrap}>
            {chartsReady ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={chartMinHeight}
              >
                <AreaChart data={[...data.readings].reverse()} margin={chartMargin}>
                  <defs>
                    <linearGradient id="temperatureFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatChartTimestamp(String(value), isCompactChart)}
                    tick={{ fill: "#64748b", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={isCompactChart ? 18 : 32}
                    height={isCompactChart ? 34 : 48}
                    tickMargin={isCompactChart ? 8 : 12}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 1", "dataMax + 1"]}
                    width={isCompactChart ? 48 : 64}
                    tickMargin={isCompactChart ? 6 : 10}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "rgba(100, 116, 139, 0.28)", strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="#f59e0b"
                    fill="url(#temperatureFill)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartPlaceholder} />
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Air Quality</p>
              <h2>Humidity, IAQ, VOC Index, and Mold Risk Trend</h2>
            </div>
            <span>Latest at {latest ? formatTimestamp(latest.timestamp) : "--"}</span>
          </div>
          <div className={styles.chartWrap}>
            {chartsReady ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={chartMinHeight}
              >
                <LineChart data={[...data.readings].reverse()} margin={chartMargin}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatChartTimestamp(String(value), isCompactChart)}
                    tick={{ fill: "#64748b", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={isCompactChart ? 18 : 32}
                    height={isCompactChart ? 34 : 48}
                    tickMargin={isCompactChart ? 8 : 12}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={isCompactChart ? 48 : 64}
                    tickMargin={isCompactChart ? 6 : 10}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "rgba(100, 116, 139, 0.28)", strokeDasharray: "4 4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="iaq"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="voc_index"
                    stroke="#b45309"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mold_risk_score"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartPlaceholder} />
            )}
          </div>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Recent Records</p>
            <h2>Latest device readings</h2>
          </div>
          <span>Device {latest?.device_id ?? "unknown"}</span>
        </div>

        <ScrollArea
          className={styles.tableWrap}
          viewportClassName={styles.tableViewport}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Battery (V)</th>
                <th>Temp (C)</th>
                <th>Humidity (%)</th>
                <th>IAQ</th>
                <th>VOC Index</th>
                <th>Mold Risk</th>
                <th>Fan PWM</th>
                <th>Pressure</th>
              </tr>
            </thead>
            <tbody>
              {data.readings.map((reading) => (
                <tr key={`${reading.device_id}-${reading.timestamp}`}>
                  <td>{formatTimestamp(reading.timestamp)}</td>
                  <td>{reading.battery_v.toFixed(2)}</td>
                  <td>{reading.temperature.toFixed(2)}</td>
                  <td>{reading.humidity.toFixed(2)}</td>
                  <td>{reading.iaq}</td>
                  <td>{reading.voc_index}</td>
                  <td>{reading.mold_risk_score.toFixed(2)}</td>
                  <td>{reading.fan_pwm}</td>
                  <td>{reading.biometric_pressure.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </article>
    </section>
  );
}
