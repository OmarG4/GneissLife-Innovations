import type { DashboardInsights, DeviceReading, RiskFactor, TrendDirection } from "@/lib/types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeRiskScore = (value: number) => clamp(value <= 1 ? value * 100 : value, 0, 100);

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getStatusLabel = (score: number) => {
  if (score >= 75) {
    return "Critical";
  }

  if (score >= 55) {
    return "Elevated";
  }

  if (score >= 30) {
    return "Guarded";
  }

  return "Stable";
};

const getTrend = (latestScore: number, baselineScore: number) => {
  const delta = latestScore - baselineScore;

  if (delta >= 4) {
    return {
      direction: "up" as TrendDirection,
      label: "Increasing",
    };
  }

  if (delta <= -4) {
    return {
      direction: "down" as TrendDirection,
      label: "Decreasing",
    };
  }

  return {
    direction: "steady" as TrendDirection,
    label: "Holding steady",
  };
};

const getForecast = (direction: TrendDirection, humidity: number, vocIndex: number) => {
  if (direction === "up") {
    return humidity >= 60 || vocIndex >= 150
      ? "Risk is increasing while humidity or VOC levels remain elevated."
      : "Risk is increasing slightly across the recent readings.";
  }

  if (direction === "down") {
    return "Risk is easing based on the recent readings.";
  }

  return "Risk is holding steady across the recent readings.";
};

const getRiskFactors = (latest: DeviceReading): RiskFactor[] => {
  const factors: RiskFactor[] = [];

  if (latest.humidity >= 65) {
    factors.push({ label: "Elevated humidity", points: 25 });
  } else if (latest.humidity >= 55) {
    factors.push({ label: "Humidity above preferred range", points: 16 });
  } else {
    factors.push({ label: "Humidity in preferred range", points: 8 });
  }

  if (latest.voc_index >= 180) {
    factors.push({ label: "High VOC", points: 18 });
  } else if (latest.voc_index >= 140) {
    factors.push({ label: "VOC trending high", points: 12 });
  } else {
    factors.push({ label: "VOC in preferred range", points: 7 });
  }

  if (latest.temperature >= 20 && latest.temperature <= 25) {
    factors.push({ label: "Optimal temperature", points: 15 });
  } else {
    factors.push({ label: "Temperature outside target", points: 10 });
  }

  return factors.sort((a, b) => b.points - a.points).slice(0, 3);
};

const getHistoryLabel = (readings: DeviceReading[]) => {
  const latest = readings[0];
  const oldest = readings[readings.length - 1];

  if (!latest || !oldest) {
    return "Waiting for readings";
  }

  const spanHours =
    (new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 3_600_000;

  if (spanHours >= 23.5) {
    return "24-hour trend";
  }

  if (spanHours >= 1) {
    return `${spanHours.toFixed(1)} hour trend`;
  }

  return `${Math.max(1, Math.round(spanHours * 60))} minute trend`;
};

export function buildDashboardInsights(readings: DeviceReading[]): DashboardInsights {
  const latest = readings[0];

  if (!latest) {
    return {
      status: {
        label: "No Data",
        score: 0,
      },
      trend: {
        direction: "steady",
        label: "Waiting for readings",
      },
      prediction: {
        score: 0,
        label: "Pending",
        forecast: "Waiting for enough readings to calculate a forecast.",
      },
      riskFactors: [],
      historyLabel: "Waiting for readings",
    };
  }

  const scores = readings.map((reading) => normalizeRiskScore(reading.mold_risk_score));
  const latestScore = scores[0];
  const baselineScore = average(scores.slice(1, 5)) || latestScore;
  const trend = getTrend(latestScore, baselineScore);
  const predictionScore = clamp(latestScore + (latestScore - baselineScore) * 0.65, 0, 100);

  return {
    status: {
      label: getStatusLabel(latestScore),
      score: latestScore,
    },
    trend,
    prediction: {
      score: predictionScore,
      label: predictionScore >= latestScore ? "Risk increasing" : "Risk easing",
      forecast: getForecast(trend.direction, latest.humidity, latest.voc_index),
    },
    riskFactors: getRiskFactors(latest),
    historyLabel: getHistoryLabel(readings),
  };
}
