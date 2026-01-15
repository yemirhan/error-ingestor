import type {
  StackFrame,
  ParsedStackTrace,
  StackParser,
  InAppConfig,
  Platform,
} from "@error-ingestor/shared";

/**
 * Default patterns for excluding library/framework code from in-app detection.
 * Frames matching these patterns will have inApp = false.
 */
const DEFAULT_EXCLUDE_PATTERNS: RegExp[] = [
  /node_modules/,
  /react-dom/,
  /react-native/,
  /webpack/,
  /metro/,
  /__webpack_require__/,
  /regenerator-runtime/,
  /\[native code\]/,
  /<anonymous>/,
  /^internal\//,
  /^node:/,
];

/**
 * Regex patterns for parsing different stack trace formats.
 *
 * Chrome/V8/Node format:
 *   "    at functionName (file:line:col)"
 *   "    at file:line:col"
 *   "    at async functionName (file:line:col)"
 *   "    at new ClassName (file:line:col)"
 */
const CHROME_FRAME_REGEX =
  /^\s*at\s+(?:(?:async|new)\s+)?(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/;

/**
 * Firefox/Safari format:
 *   "functionName@file:line:col"
 *   "@file:line:col"
 */
const FIREFOX_FRAME_REGEX = /^(.*)@(.+?):(\d+):(\d+)$/;

/**
 * React Native Hermes format:
 *   "    at functionName (address at file:line:col)"
 *   "    at functionName (file:line:col)"
 */
const HERMES_FRAME_REGEX =
  /^\s*at\s+(.+?)\s+\((?:address at\s+)?(.+?):(\d+):(\d+)\)$/;

/**
 * Check if a file name matches in-app patterns.
 */
function isInAppFrame(fileName: string | null, config?: InAppConfig): boolean {
  if (!fileName) {
    return false;
  }

  // Check exclude patterns first
  const excludePatterns = config?.excludePatterns ?? DEFAULT_EXCLUDE_PATTERNS;
  for (const pattern of excludePatterns) {
    if (typeof pattern === "string") {
      if (fileName.includes(pattern)) return false;
    } else if (pattern.test(fileName)) {
      return false;
    }
  }

  // If include patterns are defined, must match at least one
  if (config?.includePatterns && config.includePatterns.length > 0) {
    for (const pattern of config.includePatterns) {
      if (typeof pattern === "string") {
        if (fileName.includes(pattern)) return true;
      } else if (pattern.test(fileName)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

/**
 * Parse a single stack frame line using Chrome/V8/Node format.
 */
function parseChromeFrame(
  line: string,
  config?: InAppConfig
): StackFrame | null {
  const match = line.match(CHROME_FRAME_REGEX);
  if (!match) return null;

  const [, functionName, fileName, lineNumber, columnNumber] = match;
  const fileNameOrNull = fileName ?? null;

  return {
    functionName: functionName?.trim() || null,
    fileName: fileNameOrNull,
    lineNumber: lineNumber ? parseInt(lineNumber, 10) : null,
    columnNumber: columnNumber ? parseInt(columnNumber, 10) : null,
    inApp: isInAppFrame(fileNameOrNull, config),
    raw: line,
  };
}

/**
 * Parse a single stack frame line using Firefox/Safari format.
 */
function parseFirefoxFrame(
  line: string,
  config?: InAppConfig
): StackFrame | null {
  const match = line.match(FIREFOX_FRAME_REGEX);
  if (!match) return null;

  const [, functionName, fileName, lineNumber, columnNumber] = match;
  const fileNameOrNull = fileName ?? null;

  return {
    functionName: functionName?.trim() || null,
    fileName: fileNameOrNull,
    lineNumber: lineNumber ? parseInt(lineNumber, 10) : null,
    columnNumber: columnNumber ? parseInt(columnNumber, 10) : null,
    inApp: isInAppFrame(fileNameOrNull, config),
    raw: line,
  };
}

/**
 * Parse a single stack frame line using React Native Hermes format.
 */
function parseHermesFrame(
  line: string,
  config?: InAppConfig
): StackFrame | null {
  const match = line.match(HERMES_FRAME_REGEX);
  if (!match) return null;

  const [, functionName, fileName, lineNumber, columnNumber] = match;
  const fileNameOrNull = fileName ?? null;

  return {
    functionName: functionName?.trim() || null,
    fileName: fileNameOrNull,
    lineNumber: lineNumber ? parseInt(lineNumber, 10) : null,
    columnNumber: columnNumber ? parseInt(columnNumber, 10) : null,
    inApp: isInAppFrame(fileNameOrNull, config),
    raw: line,
  };
}

/**
 * Try to parse a stack frame line with multiple parsers.
 * Returns the first successful parse, or a fallback frame.
 */
function parseFrame(
  line: string,
  platform: Platform,
  config?: InAppConfig
): StackFrame | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // Skip the first line if it's the error message
  if (
    trimmedLine.startsWith("Error:") ||
    trimmedLine.startsWith("TypeError:") ||
    trimmedLine.startsWith("ReferenceError:") ||
    trimmedLine.startsWith("SyntaxError:") ||
    trimmedLine.startsWith("RangeError:")
  ) {
    return null;
  }

  // Try platform-specific parser first
  if (platform === "ios" || platform === "android") {
    // React Native - try Hermes format first, then Chrome
    const hermesFrame = parseHermesFrame(line, config);
    if (hermesFrame) return hermesFrame;

    const chromeFrame = parseChromeFrame(line, config);
    if (chromeFrame) return chromeFrame;
  } else {
    // Web - try Chrome first, then Firefox
    const chromeFrame = parseChromeFrame(line, config);
    if (chromeFrame) return chromeFrame;

    const firefoxFrame = parseFirefoxFrame(line, config);
    if (firefoxFrame) return firefoxFrame;
  }

  // Fallback: create a frame with just the raw line
  return {
    functionName: null,
    fileName: null,
    lineNumber: null,
    columnNumber: null,
    inApp: false,
    raw: line,
  };
}

/**
 * Detect which parser was most successful for this stack trace.
 */
function detectParser(platform: Platform, stack: string): StackParser {
  if (platform === "ios" || platform === "android") {
    // Check if it looks like Hermes format
    if (stack.includes("address at ") || /at .+ \(.+:\d+:\d+\)/.test(stack)) {
      return "react-native";
    }
    return "react-native";
  }

  // Check for Chrome/V8 format
  if (stack.includes("    at ")) {
    return "browser";
  }

  // Check for Firefox/Safari format
  if (/@.+:\d+:\d+/.test(stack)) {
    return "browser";
  }

  // Check for Node.js specific patterns
  if (stack.includes("(node:") || stack.includes("(internal/")) {
    return "node";
  }

  return "unknown";
}

/**
 * Parse a stack trace string into structured frames.
 *
 * @param stack - The raw stack trace string from error.stack
 * @param platform - The platform the error occurred on
 * @param config - Optional configuration for in-app frame detection
 * @returns ParsedStackTrace with structured frames
 */
export function parseStackTrace(
  stack: string,
  platform: Platform,
  config?: InAppConfig
): ParsedStackTrace {
  if (!stack) {
    return {
      frames: [],
      raw: "",
      parser: "unknown",
    };
  }

  const lines = stack.split("\n");
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const frame = parseFrame(line, platform, config);
    if (frame) {
      frames.push(frame);
    }
  }

  return {
    frames,
    raw: stack,
    parser: detectParser(platform, stack),
  };
}

export { isInAppFrame, DEFAULT_EXCLUDE_PATTERNS };
