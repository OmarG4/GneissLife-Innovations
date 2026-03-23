import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient } from "@/lib/dynamodb";
import { mockReadings } from "@/lib/mock-data";
import type { DashboardResponse, DeviceReading } from "@/lib/types";

const DEFAULT_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "metatron_device_data";
const DEFAULT_LIMIT = 12;

const toNumber = (value: unknown) => Number(value ?? 0);

const normalizeReading = (item: Record<string, unknown>): DeviceReading => ({
  device_id: String(item.device_id ?? "unknown"),
  timestamp: String(item.timestamp ?? new Date().toISOString()),
  battery_v: toNumber(item.battery_v),
  biometric_pressure: toNumber(item.biometric_pressure),
  fan_pwm: toNumber(item.fan_pwm),
  humidity: toNumber(item.humidity),
  iaq: toNumber(item.iaq),
  temperature: toNumber(item.temperature),
  voc: toNumber(item.voc),
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

      return {
        source: "live",
        tableName,
        message: `Live query for device ${configuredDeviceId}.`,
        readings: sortReadings(queryItems),
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

    return {
      source: "live",
      tableName,
      message: "Live scan from DynamoDB. Set DEVICE_ID for a more efficient query.",
      readings: sortReadings(scanItems).slice(0, DEFAULT_LIMIT),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown DynamoDB error";

    return {
      source: "mock",
      tableName,
      message: `Fell back to mock data because DynamoDB could not be read: ${message}`,
      readings: mockReadings,
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
  };
}
