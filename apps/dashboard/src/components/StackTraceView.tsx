import { useState } from "react";
import type { ParsedStackTrace, StackFrame } from "@error-ingestor/shared";

interface StackTraceViewProps {
  parsedStack?: ParsedStackTrace;
  rawStackTrace: string;
}

const styles = {
  container: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    background: "#1a1a2e",
    borderRadius: "4px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #2a2a4e",
    background: "#12121f",
  },
  parserBadge: {
    fontSize: "0.625rem",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    background: "#3a3a5e",
    color: "#a0a0c0",
    textTransform: "uppercase" as const,
  },
  toggleButton: {
    background: "none",
    border: "1px solid #3a3a5e",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.625rem",
    color: "#a0a0c0",
    cursor: "pointer",
  },
  frameList: {
    maxHeight: "400px",
    overflow: "auto",
  },
  frame: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #2a2a4e",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  frameInApp: {
    background: "#1e1e3a",
  },
  frameLibrary: {
    background: "#16162a",
    opacity: 0.7,
  },
  frameHover: {
    background: "#2a2a4e",
  },
  frameHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.25rem",
  },
  functionName: {
    fontWeight: 600,
    color: "#e0e0e0",
  },
  anonymousFunction: {
    fontWeight: 600,
    color: "#808090",
    fontStyle: "italic" as const,
  },
  inAppBadge: {
    fontSize: "0.5rem",
    padding: "0.125rem 0.375rem",
    borderRadius: "3px",
    background: "#4ade80",
    color: "#052e16",
    fontWeight: 600,
  },
  resolvedBadge: {
    fontSize: "0.5rem",
    padding: "0.125rem 0.375rem",
    borderRadius: "3px",
    background: "#60a5fa",
    color: "#1e3a5f",
    fontWeight: 600,
  },
  location: {
    color: "#8080a0",
    fontSize: "0.6875rem",
    paddingLeft: "0.5rem",
  },
  originalLocation: {
    color: "#4ade80",
    fontSize: "0.6875rem",
    paddingLeft: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    marginTop: "0.25rem",
  },
  arrow: {
    color: "#606080",
  },
  checkmark: {
    color: "#4ade80",
  },
  rawTrace: {
    padding: "1rem",
    color: "#e0e0e0",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    maxHeight: "300px",
    overflow: "auto",
  },
  stats: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.625rem",
    color: "#808090",
  },
  noFrames: {
    padding: "1rem",
    color: "#808090",
    textAlign: "center" as const,
  },
};

function formatLocation(
  fileName: string | null,
  lineNumber: number | null,
  columnNumber: number | null
): string {
  if (!fileName) return "<unknown>";
  let loc = fileName;
  if (lineNumber !== null) {
    loc += `:${lineNumber}`;
    if (columnNumber !== null) {
      loc += `:${columnNumber}`;
    }
  }
  return loc;
}

function StackFrameRow({
  frame,
  isExpanded,
}: {
  frame: StackFrame;
  isExpanded: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = frame.inApp ? styles.frameInApp : styles.frameLibrary;
  const frameStyle = {
    ...styles.frame,
    ...baseStyle,
    ...(isHovered ? styles.frameHover : {}),
  };

  const location = formatLocation(
    frame.fileName,
    frame.lineNumber,
    frame.columnNumber
  );

  const hasOriginal =
    frame.resolved && frame.originalFileName && frame.originalLineNumber;
  const originalLocation = hasOriginal
    ? formatLocation(
        frame.originalFileName!,
        frame.originalLineNumber!,
        frame.originalColumnNumber ?? null
      )
    : null;

  return (
    <div
      style={frameStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.frameHeader}>
        <span
          style={
            frame.functionName ? styles.functionName : styles.anonymousFunction
          }
        >
          {frame.functionName || "<anonymous>"}
        </span>
        {frame.inApp && <span style={styles.inAppBadge}>APP</span>}
        {frame.resolved && <span style={styles.resolvedBadge}>MAPPED</span>}
      </div>
      <div style={styles.location}>{location}</div>
      {isExpanded && originalLocation && (
        <div style={styles.originalLocation}>
          <span style={styles.arrow}>{">"}</span>
          <span>{originalLocation}</span>
          <span style={styles.checkmark}>{"OK"}</span>
        </div>
      )}
    </div>
  );
}

export function StackTraceView({
  parsedStack,
  rawStackTrace,
}: StackTraceViewProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [expandAll, setExpandAll] = useState(true);

  // If no parsed stack, show raw trace
  if (!parsedStack || parsedStack.frames.length === 0) {
    return (
      <div style={styles.container}>
        <pre style={styles.rawTrace}>{rawStackTrace || "No stack trace"}</pre>
      </div>
    );
  }

  const inAppCount = parsedStack.frames.filter((f) => f.inApp).length;
  const resolvedCount = parsedStack.frames.filter((f) => f.resolved).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.stats}>
          <span style={styles.parserBadge}>{parsedStack.parser}</span>
          <span>
            {parsedStack.frames.length} frames ({inAppCount} in-app)
          </span>
          {resolvedCount > 0 && <span>{resolvedCount} source-mapped</span>}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            style={styles.toggleButton}
            onClick={() => setExpandAll(!expandAll)}
          >
            {expandAll ? "Collapse" : "Expand"}
          </button>
          <button
            style={styles.toggleButton}
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? "Parsed" : "Raw"}
          </button>
        </div>
      </div>

      {showRaw ? (
        <pre style={styles.rawTrace}>{rawStackTrace}</pre>
      ) : (
        <div style={styles.frameList}>
          {parsedStack.frames.map((frame, index) => (
            <StackFrameRow
              key={index}
              frame={frame}
              isExpanded={expandAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
