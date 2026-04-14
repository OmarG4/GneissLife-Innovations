export type DeviceReading = {
  device_id: string;
  timestamp: string;
  battery_percentage: number;
  battery_v: number;
  biometric_pressure: number;
  fan_pwm: number;
  humidity: number;
  iaq: number;
  mold_risk_score: number;
  temperature: number;
  voc_index: number;
};

export type TrendDirection = "up" | "down" | "steady";

export type RiskFactor = {
  label: string;
  points: number;
};

export type DashboardInsights = {
  status: {
    label: string;
    score: number;
  };
  trend: {
    direction: TrendDirection;
    label: string;
  };
  prediction: {
    score: number;
    label: string;
    forecast: string;
  };
  riskFactors: RiskFactor[];
  historyLabel: string;
};

export type DashboardResponse = {
  source: "live" | "mock";
  tableName: string;
  message: string;
  readings: DeviceReading[];
  insights: DashboardInsights;
};
