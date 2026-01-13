import type { ErrorEvent } from "@error-ingestor/shared";

interface ErrorListProps {
  errors: ErrorEvent[];
  onSelect?: (error: ErrorEvent) => void;
}

const styles = {
  container: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.875rem",
  },
  th: {
    textAlign: "left" as const,
    padding: "0.75rem 1rem",
    background: "#f8f9fa",
    borderBottom: "1px solid #eee",
    fontWeight: 600,
    color: "#666",
  },
  td: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #eee",
  },
  row: {
    cursor: "pointer",
    transition: "background 0.2s",
  },
  code: {
    fontFamily: "monospace",
    background: "#f0f0f0",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
  },
  message: {
    maxWidth: "300px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  platform: {
    display: "inline-block",
    padding: "0.125rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  platformIos: {
    background: "#e3f2fd",
    color: "#1976d2",
  },
  platformAndroid: {
    background: "#e8f5e9",
    color: "#388e3c",
  },
  platformWeb: {
    background: "#fff3e0",
    color: "#f57c00",
  },
  empty: {
    padding: "2rem",
    textAlign: "center" as const,
    color: "#666",
  },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function getPlatformStyle(platform: string) {
  switch (platform) {
    case "ios":
      return { ...styles.platform, ...styles.platformIos };
    case "android":
      return { ...styles.platform, ...styles.platformAndroid };
    default:
      return { ...styles.platform, ...styles.platformWeb };
  }
}

export function ErrorList({ errors, onSelect }: ErrorListProps) {
  if (errors.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No errors found for the selected filters.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Code</th>
            <th style={styles.th}>Message</th>
            <th style={styles.th}>Platform</th>
            <th style={styles.th}>Version</th>
            <th style={styles.th}>User</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error) => (
            <tr
              key={error.id}
              style={styles.row}
              onClick={() => onSelect?.(error)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#f8f9fa")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "white")}
            >
              <td style={styles.td}>{formatTime(error.timestamp)}</td>
              <td style={styles.td}>
                <span style={styles.code}>{error.code}</span>
              </td>
              <td style={{ ...styles.td, ...styles.message }}>
                {error.message}
              </td>
              <td style={styles.td}>
                <span style={getPlatformStyle(error.platform)}>
                  {error.platform}
                </span>
              </td>
              <td style={styles.td}>{error.appVersion}</td>
              <td style={styles.td}>{error.userId ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
