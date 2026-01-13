import { useState, useMemo } from "react";
import type { ErrorEvent } from "@error-ingestor/shared";
import { useErrors, useApps, useErrorCodes } from "../hooks/useErrors";
import { Filters } from "../components/Filters";
import { ErrorList } from "../components/ErrorList";
import { ErrorDetails } from "../components/ErrorDetails";

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
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1rem",
  },
  pageInfo: {
    color: "#666",
    fontSize: "0.875rem",
  },
  button: {
    padding: "0.5rem 1rem",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

function getTimeRange(range: string): { startTime: string; endTime: string } {
  const now = new Date();
  const endTime = now.toISOString();

  let startTime: Date;
  switch (range) {
    case "1h":
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
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
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return { startTime: startTime.toISOString(), endTime };
}

export function ErrorListPage() {
  const [appId, setAppId] = useState("test-app");
  const [code, setCode] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [offset, setOffset] = useState(0);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);

  const limit = 50;
  const { startTime, endTime } = useMemo(() => getTimeRange(timeRange), [timeRange]);

  const { data: appsData } = useApps();
  const { data: codesData } = useErrorCodes(appId);
  const { data, isLoading, error } = useErrors({
    appId,
    startTime,
    endTime,
    code: code || undefined,
    limit,
    offset,
  });

  const apps = appsData?.apps ?? [];
  const codes = codesData?.codes ?? [];

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (data?.pagination.hasMore) {
      setOffset(offset + limit);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Error Events</h1>
        <p style={styles.subtitle}>
          View and analyze errors from your applications
        </p>
      </div>

      <Filters
        appId={appId}
        onAppIdChange={(id) => {
          setAppId(id);
          setOffset(0);
        }}
        code={code}
        onCodeChange={(c) => {
          setCode(c);
          setOffset(0);
        }}
        timeRange={timeRange}
        onTimeRangeChange={(r) => {
          setTimeRange(r);
          setOffset(0);
        }}
        apps={apps}
        codes={codes}
      />

      {error && (
        <div style={styles.error}>
          Failed to load errors. Make sure the server is running.
        </div>
      )}

      {isLoading ? (
        <div style={styles.loading}>Loading errors...</div>
      ) : (
        <>
          <ErrorList
            errors={data?.errors ?? []}
            onSelect={setSelectedError}
          />

          <div style={styles.pagination}>
            <span style={styles.pageInfo}>
              Showing {offset + 1} -{" "}
              {offset + (data?.errors.length ?? 0)} errors
            </span>
            <div>
              <button
                style={{
                  ...styles.button,
                  ...(offset === 0 ? styles.buttonDisabled : {}),
                }}
                onClick={handlePrevPage}
                disabled={offset === 0}
              >
                Previous
              </button>{" "}
              <button
                style={{
                  ...styles.button,
                  ...(!data?.pagination.hasMore ? styles.buttonDisabled : {}),
                }}
                onClick={handleNextPage}
                disabled={!data?.pagination.hasMore}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedError && (
        <ErrorDetails
          error={selectedError}
          onClose={() => setSelectedError(null)}
        />
      )}
    </div>
  );
}
