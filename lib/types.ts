export type DeviceReading = {
  device_id: string;
  timestamp: string;
  battery_v: number;
  biometric_pressure: number;
  fan_pwm: number;
  humidity: number;
  iaq: number;
  temperature: number;
  voc: number;
};

export type DashboardResponse = {
  source: "live" | "mock";
  tableName: string;
  message: string;
  readings: DeviceReading[];
};
