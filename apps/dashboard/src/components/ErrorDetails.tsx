import type { ErrorEvent } from "@error-ingestor/shared";
import { StackTraceView } from "./StackTraceView";

interface ErrorDetailsProps {
  error: ErrorEvent;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "8px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  header: {
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "1.125rem",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
  },
  content: {
    padding: "1.5rem",
  },
  section: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    color: "#666",
    fontWeight: 600,
    marginBottom: "0.5rem",
    textTransform: "uppercase" as const,
  },
  row: {
    display: "flex",
    gap: "2rem",
    marginBottom: "1rem",
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: "0.75rem",
    color: "#999",
    marginBottom: "0.25rem",
  },
  value: {
    fontSize: "0.875rem",
  },
  code: {
    fontFamily: "monospace",
    background: "#f5f5f5",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  stackTrace: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    background: "#1a1a2e",
    color: "#e0e0e0",
    padding: "1rem",
    borderRadius: "4px",
    overflow: "auto",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    maxHeight: "300px",
  },
  metadata: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    background: "#f5f5f5",
    padding: "1rem",
    borderRadius: "4px",
    overflow: "auto",
    whiteSpace: "pre-wrap" as const,
  },
};

export function ErrorDetails({ error, onClose }: ErrorDetailsProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Error Details</h2>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Error Info</div>
            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>Code</div>
                <div style={styles.value}>
                  <span style={styles.code}>{error.code}</span>
                </div>
              </div>
              <div style={styles.field}>
                <div style={styles.label}>Timestamp</div>
                <div style={styles.value}>
                  {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <div style={styles.field}>
              <div style={styles.label}>Message</div>
              <div style={styles.value}>{error.message}</div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Context</div>
            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>Platform</div>
                <div style={styles.value}>{error.platform}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.label}>Platform Version</div>
                <div style={styles.value}>{error.platformVersion}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.label}>App Version</div>
                <div style={styles.value}>{error.appVersion}</div>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <div style={styles.label}>User ID</div>
                <div style={styles.value}>{error.userId ?? "Anonymous"}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.label}>Error ID</div>
                <div style={styles.value}>
                  <span style={styles.code}>{error.id}</span>
                </div>
              </div>
            </div>
          </div>

          {(error.stackTrace || error.parsedStack) && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Stack Trace</div>
              <StackTraceView
                parsedStack={error.parsedStack}
                rawStackTrace={error.stackTrace}
              />
            </div>
          )}

          {error.metadata && Object.keys(error.metadata).length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Metadata</div>
              <pre style={styles.metadata}>
                {JSON.stringify(error.metadata, null, 2)}
              </pre>
            </div>
          )}

          {error.tags && Object.keys(error.tags).length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Tags</div>
              <pre style={styles.metadata}>
                {JSON.stringify(error.tags, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
