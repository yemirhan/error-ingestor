import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ErrorTrendPoint } from "@error-ingestor/shared";

interface ErrorTrendsProps {
  data: ErrorTrendPoint[];
  granularity: "hour" | "day";
}

const styles = {
  container: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "1.5rem",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  empty: {
    textAlign: "center" as const,
    color: "#666",
    padding: "2rem",
  },
};

function formatTime(value: string, granularity: "hour" | "day"): string {
  const date = new Date(value);
  if (granularity === "hour") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ErrorTrends({ data, granularity }: ErrorTrendsProps) {
  if (data.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Error Trends</h3>
        <div style={styles.empty}>No trend data available.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Error Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="time"
            tickFormatter={(value) => formatTime(value, granularity)}
            stroke="#666"
            fontSize={12}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip
            labelFormatter={(value) => new Date(value as string).toLocaleString()}
            contentStyle={{
              background: "white",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="Error Count"
          />
          <Line
            type="monotone"
            dataKey="uniqueCodes"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Unique Codes"
          />
          <Line
            type="monotone"
            dataKey="affectedUsers"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Affected Users"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
