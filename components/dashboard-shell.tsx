"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  DatabaseZap,
  Lock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
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
  devices: {
    id: string;
    name: string;
    status: string;
  }[];
};

const metricCards = [
  { key: "temperature", label: "Temperature", unit: "C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "voc_index", label: "VOC Index", unit: "" },
  { key: "biometric_pressure", label: "Pressure", unit: "hPa" },
] as const;

const formatMetricValue = (value: number, unit: string) => {
  const formatted =
    unit === "" ? value.toFixed(0) : value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);

  if (unit.startsWith("/")) {
    return `${formatted}${unit}`;
  }

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
  temperature: { label: "Temperature", color: "var(--chart-temperature)", unit: "C" },
  humidity: { label: "Humidity", color: "var(--chart-humidity)", unit: "%" },
  iaq: { label: "IAQ", color: "var(--chart-iaq)", unit: "" },
  voc_index: { label: "VOC Index", color: "var(--chart-voc)", unit: "" },
  mold_risk_score_display: { label: "Mold Risk", color: "var(--chart-mold)", unit: "/100" },
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

const normalizeRiskScore = (value: number) => (value <= 1 ? value * 100 : value);

const formatRiskScore = (value: number | undefined) => {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(normalizeRiskScore(value))}/100`;
};

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  steady: ArrowRight,
} as const;

export function DashboardShell({ initialData, devices }: DashboardShellProps) {
  const [data, setData] = useState(initialData);
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id ?? "");
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
  const insights = data.insights;
  const TrendIcon = trendIcons[insights.trend.direction];
  const chartData = [...data.readings].reverse().map((reading) => ({
    ...reading,
    mold_risk_score_display: normalizeRiskScore(reading.mold_risk_score),
  }));
  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) ?? devices[0];
  const averages = {
    temperature: getAverage(data.readings, "temperature"),
    humidity: getAverage(data.readings, "humidity"),
    voc_index: getAverage(data.readings, "voc_index"),
    biometric_pressure: getAverage(data.readings, "biometric_pressure"),
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
        <div className={styles.heroMain}>
          <div className={styles.dashboardHeading}>
            <div>
              <p className={styles.eyebrow}>Current device</p>
              <h1 className={styles.title}>Metatron device dashboard</h1>
            </div>

            <div className={styles.deviceControls}>
              <label className={styles.deviceField}>
                <span className={styles.deviceLabel}>Device</span>
                <div className={styles.deviceSelectWrap}>
                  <select
                    className={styles.deviceSelect}
                    value={selectedDeviceId}
                    onChange={(event) => setSelectedDeviceId(event.target.value)}
                  >
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className={styles.deviceSelectIcon} />
                </div>
              </label>

              <button type="button" className={styles.addDeviceButton} disabled title="Coming soon">
                <Lock size={16} />
                Add New Device
              </button>
            </div>
          </div>

          {selectedDevice ? (
            <div className={styles.deviceMeta}>
              <span>
                <DatabaseZap size={14} />
                {selectedDevice.id}
              </span>
              <span>{selectedDevice.status}</span>
            </div>
          ) : null}
        </div>

        <div className={styles.heroSide}>
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>Current feed</span>
                <strong>{data.source === "live" ? "Live readings" : "Sample readings"}</strong>
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
            <span className={styles.statusHint}>
              {latest ? `Latest update ${formatTimestamp(latest.timestamp)}` : "Waiting for readings"}
            </span>
          </div>

          <div className={styles.actionStack}>
            <button className={styles.refreshButton} onClick={refreshData} disabled={isPending}>
              <RefreshCw size={16} className={isPending ? styles.spin : ""} />
              {isPending ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </div>
      </div>

      <article className={styles.moldRiskBanner}>
        <div>
          <div className={styles.signalBadge}>
            <ShieldAlert size={16} />
            <p className={styles.panelEyebrow}>Primary Signal</p>
          </div>
          <h2>Mold risk score</h2>
        </div>
        <strong className={styles.moldRiskBannerValue}>
          {Math.round(insights.status.score)}/100
        </strong>
        <div className={styles.moldRiskBannerMeta}>
          <span>
            Current Status: {insights.status.label.toUpperCase()} [{Math.round(insights.status.score)}]
          </span>
          <span className={styles.trendLabel}>
            <TrendIcon size={16} />
            Trend: {insights.trend.label}
          </span>
        </div>
      </article>

      <div className={styles.summaryGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Environmental Conditions</p>
              <h2>Current environment</h2>
            </div>
          </div>
          <div className={styles.conditionGrid}>
            <span>Temp: {latest ? formatMetricValue(latest.temperature, "C") : "--"}</span>
            <span>Humid: {latest ? formatMetricValue(latest.humidity, "%") : "--"}</span>
            <span>VOC: {latest ? formatMetricValue(latest.voc_index, "") : "--"}</span>
            <span>Press: {latest ? formatMetricValue(latest.biometric_pressure, "hPa") : "--"}</span>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Prediction</p>
              <h2>1-hour outlook</h2>
            </div>
            <span>{Math.round(insights.prediction.score)}/100</span>
          </div>
          <p className={styles.forecastText}>{insights.prediction.forecast}</p>
          <span className={styles.predictionLabel}>Forecast: {insights.prediction.label}</span>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Key Risk Factors</p>
              <h2>Primary drivers</h2>
            </div>
          </div>
          <div className={styles.riskFactorList}>
            {insights.riskFactors.map((factor) => (
              <div className={styles.riskFactorRow} key={factor.label}>
                <span>{factor.label}</span>
                <strong>{factor.points} pts</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

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
              <p className={styles.panelEyebrow}>Risk History</p>
              <h2>Mold risk trend</h2>
            </div>
            <span>{insights.historyLabel}</span>
          </div>
          <div className={styles.chartWrap}>
            {chartsReady ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={chartMinHeight}
              >
                <AreaChart data={chartData} margin={chartMargin}>
                  <defs>
                    <linearGradient id="moldRiskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-mold)" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="var(--chart-mold)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatChartTimestamp(String(value), isCompactChart)}
                    tick={{ fill: "var(--chart-axis)", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={isCompactChart ? 18 : 32}
                    height={isCompactChart ? 34 : 48}
                    tickMargin={isCompactChart ? 8 : 12}
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-axis)", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    width={isCompactChart ? 48 : 64}
                    tickMargin={isCompactChart ? 6 : 10}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "var(--chart-cursor)", strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mold_risk_score_display"
                    stroke="var(--chart-mold)"
                    fill="url(#moldRiskFill)"
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
              <h2>Environmental trend</h2>
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
                <LineChart data={chartData} margin={chartMargin}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatChartTimestamp(String(value), isCompactChart)}
                    tick={{ fill: "var(--chart-axis)", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={isCompactChart ? 18 : 32}
                    height={isCompactChart ? 34 : 48}
                    tickMargin={isCompactChart ? 8 : 12}
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-axis)", fontSize: isCompactChart ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={isCompactChart ? 48 : 64}
                    tickMargin={isCompactChart ? 6 : 10}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "var(--chart-cursor)", strokeDasharray: "4 4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="var(--chart-humidity)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="iaq"
                    stroke="var(--chart-iaq)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="voc_index"
                    stroke="var(--chart-voc)"
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
                  <td>{formatRiskScore(reading.mold_risk_score)}</td>
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
