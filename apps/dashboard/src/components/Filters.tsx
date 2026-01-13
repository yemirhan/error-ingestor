interface FiltersProps {
  appId: string;
  onAppIdChange: (appId: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  apps: Array<{ id: string; name: string }>;
  codes: Array<{ code: string; count: number }>;
}

const styles = {
  container: {
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
};

const timeRanges = [
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export function Filters({
  appId,
  onAppIdChange,
  code,
  onCodeChange,
  timeRange,
  onTimeRangeChange,
  apps,
  codes,
}: FiltersProps) {
  return (
    <div style={styles.container}>
      <div style={styles.group}>
        <label style={styles.label}>Application</label>
        <select
          style={styles.select}
          value={appId}
          onChange={(e) => onAppIdChange(e.target.value)}
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
        <label style={styles.label}>Error Code</label>
        <select
          style={styles.select}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
        >
          <option value="">All codes</option>
          {codes.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.count})
            </option>
          ))}
        </select>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Time Range</label>
        <select
          style={styles.select}
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
        >
          {timeRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
