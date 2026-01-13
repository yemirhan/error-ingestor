import { useState, useMemo } from "react";
import { useTrends, useApps } from "../hooks/useErrors";
import { ErrorTrends } from "../components/ErrorTrends";

const styles = {
  header: {
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#666",
    fontSize: "0.875rem",
  },
  filters: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap" as const,
  },
  group: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.75rem",
    color: "#666",
    fontWeight: 500,
  },
  select: {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
    background: "white",
    fontSize: "0.875rem",
    minWidth: "150px",
  },
  loading: {
    textAlign: "center" as const,
    padding: "2rem",
    color: "#666",
  },
  error: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  statCard: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "1rem 1.5rem",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#666",
    marginBottom: "0.25rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 600,
  },
};

const timeRanges = [
  { value: "24h", label: "Last 24 Hours", granularity: "hour" as const },
  { value: "7d", label: "Last 7 Days", granularity: "hour" as const },
  { value: "30d", label: "Last 30 Days", granularity: "day" as const },
];

function getTimeRange(range: string): { startTime: string; endTime: string } {
  const now = new Date();
  const endTime = now.toISOString();

  let startTime: Date;
  switch (range) {
    case "24h":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { startTime: startTime.toISOString(), endTime };
}

export function TrendsPage() {
  const [appId, setAppId] = useState("test-app");
  const [timeRangeValue, setTimeRangeValue] = useState("7d");

  const selectedRange = timeRanges.find((r) => r.value === timeRangeValue);
  const granularity = selectedRange?.granularity ?? "hour";
  const { startTime, endTime } = useMemo(
    () => getTimeRange(timeRangeValue),
    [timeRangeValue]
  );

  const { data: appsData } = useApps();
  const { data, isLoading, error } = useTrends({
    appId,
    startTime,
    endTime,
    granularity,
  });

  const apps = appsData?.apps ?? [];
  const trends = data?.trends ?? [];

  // Calculate summary stats
  const totalErrors = trends.reduce((sum, t) => sum + t.count, 0);
  const uniqueCodes = Math.max(...trends.map((t) => t.uniqueCodes), 0);
  const affectedUsers = Math.max(...trends.map((t) => t.affectedUsers), 0);

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Error Trends</h1>
        <p style={styles.subtitle}>
          Analyze error patterns over time
        </p>
      </div>

      <div style={styles.filters}>
        <div style={styles.group}>
          <label style={styles.label}>Application</label>
          <select
            style={styles.select}
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
          >
            <option value="">Select app...</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Time Range</label>
          <select
            style={styles.select}
            value={timeRangeValue}
            onChange={(e) => setTimeRangeValue(e.target.value)}
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          Failed to load trends. Make sure the server is running.
        </div>
      )}

      {!isLoading && trends.length > 0 && (
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Errors</div>
            <div style={styles.statValue}>{totalErrors.toLocaleString()}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Unique Error Codes</div>
            <div style={styles.statValue}>{uniqueCodes}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Affected Users</div>
            <div style={styles.statValue}>{affectedUsers}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={styles.loading}>Loading trends...</div>
      ) : (
        <ErrorTrends data={trends} granularity={granularity} />
      )}
    </div>
  );
}
