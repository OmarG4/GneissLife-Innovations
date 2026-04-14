import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { buildDashboardInsights } from "@/lib/dashboard-insights";
import { getDocumentClient } from "@/lib/dynamodb";
import { mockReadings } from "@/lib/mock-data";
import type { DashboardResponse, DeviceReading } from "@/lib/types";

const DEFAULT_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "metatron_device_data";
const DEFAULT_LIMIT = 12;

const toNumber = (value: unknown) => Number(value ?? 0);

const normalizeReading = (item: Record<string, unknown>): DeviceReading => ({
  device_id: String(item.device_id ?? "unknown"),
  timestamp: String(item.timestamp ?? new Date().toISOString()),
  battery_percentage: toNumber(item.battery_percentage ?? item.battery_percenatage),
  battery_v: toNumber(item.battery_v),
  biometric_pressure: toNumber(item.biometric_pressure),
  fan_pwm: toNumber(item.fan_pwm),
  humidity: toNumber(item.humidity),
  iaq: toNumber(item.iaq),
  mold_risk_score: toNumber(item.mold_risk_score),
  temperature: toNumber(item.temperature),
  voc_index: toNumber(item.voc_index ?? item.voc),
});

const sortReadings = (readings: DeviceReading[]) =>
  readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

async function fetchLiveReadings(): Promise<DashboardResponse | null> {
  const client = getDocumentClient();

  if (!client) {
    return null;
  }

  const tableName = process.env.DYNAMODB_TABLE_NAME ?? DEFAULT_TABLE_NAME;
  const configuredDeviceId = process.env.DEVICE_ID;

  try {
    if (configuredDeviceId) {
      const queryResponse = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "device_id = :deviceId",
          ExpressionAttributeValues: {
            ":deviceId": configuredDeviceId,
          },
          ScanIndexForward: false,
          Limit: DEFAULT_LIMIT,
        }),
      );

      const queryItems = (queryResponse.Items ?? []).map((item) =>
        normalizeReading(item as Record<string, unknown>),
      );
      const readings = sortReadings(queryItems);

      return {
        source: "live",
        tableName,
        message: `Live query for device ${configuredDeviceId}.`,
        readings,
        insights: buildDashboardInsights(readings),
      };
    }

    const scanResponse = await client.send(
      new ScanCommand({
        TableName: tableName,
        Limit: 50,
      }),
    );

    const scanItems = (scanResponse.Items ?? []).map((item) =>
      normalizeReading(item as Record<string, unknown>),
    );
    const readings = sortReadings(scanItems).slice(0, DEFAULT_LIMIT);

    return {
      source: "live",
      tableName,
      message: "Live scan from DynamoDB. Set DEVICE_ID for a more efficient query.",
      readings,
      insights: buildDashboardInsights(readings),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown DynamoDB error";

    return {
      source: "mock",
      tableName,
      message: `Fell back to mock data because DynamoDB could not be read: ${message}`,
      readings: mockReadings,
      insights: buildDashboardInsights(mockReadings),
    };
  }
}

export async function getDashboardData(): Promise<DashboardResponse> {
  const liveResponse = await fetchLiveReadings();

  if (liveResponse && liveResponse.readings.length > 0) {
    return liveResponse;
  }

  return {
    source: "mock",
    tableName: DEFAULT_TABLE_NAME,
    message:
      "Showing sample readings until AWS credentials are configured or live records become available.",
    readings: mockReadings,
    insights: buildDashboardInsights(mockReadings),
  };
}
