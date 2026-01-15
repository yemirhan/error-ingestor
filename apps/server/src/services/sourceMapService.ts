import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
import type { StackFrame, ParsedStackTrace } from "@error-ingestor/shared";
import { clickhouseClient } from "../clickhouse/client";

interface CacheEntry {
  map: TraceMap;
  loadedAt: number;
}

/**
 * Service for resolving source maps to map minified stack traces
 * back to original source code locations.
 */
class SourceMapService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Generate a cache key for a source map.
   */
  private getCacheKey(appId: string, appVersion: string, fileName: string): string {
    return `${appId}:${appVersion}:${fileName}`;
  }

  /**
   * Extract the bundle file name from a full file path/URL.
   * e.g., "http://localhost:8081/index.bundle?platform=ios" -> "index.bundle"
   */
  private extractBundleName(filePath: string): string {
    try {
      // Try parsing as URL first
      const url = new URL(filePath, "http://localhost");
      const pathname = url.pathname;
      const parts = pathname.split("/");
      return parts[parts.length - 1] || filePath;
    } catch {
      // If not a URL, just get the last path segment
      const parts = filePath.split("/");
      return parts[parts.length - 1] || filePath;
    }
  }

  /**
   * Get a source map from cache or load from database.
   */
  private async getSourceMap(
    appId: string,
    appVersion: string,
    fileName: string
  ): Promise<TraceMap | null> {
    const cacheKey = this.getCacheKey(appId, appVersion, fileName);
    const cached = this.cache.get(cacheKey);

    // Check if cached and not expired
    if (cached && Date.now() - cached.loadedAt < this.CACHE_TTL_MS) {
      return cached.map;
    }

    // Load from database
    const sourceMapJson = await clickhouseClient.getSourceMap(
      appId,
      appVersion,
      fileName
    );

    if (!sourceMapJson) {
      return null;
    }

    try {
      const map = new TraceMap(sourceMapJson);

      // Evict oldest entries if cache is full
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const oldest = [...this.cache.entries()].sort(
          (a, b) => a[1].loadedAt - b[1].loadedAt
        )[0];
        if (oldest) {
          this.cache.delete(oldest[0]);
        }
      }

      // Cache the parsed map
      this.cache.set(cacheKey, {
        map,
        loadedAt: Date.now(),
      });

      return map;
    } catch (error) {
      console.error(`Failed to parse source map for ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Resolve a single stack frame using source maps.
   */
  async resolveFrame(
    frame: StackFrame,
    appId: string,
    appVersion: string
  ): Promise<StackFrame> {
    // Skip frames without file/line info
    if (!frame.fileName || !frame.lineNumber) {
      return frame;
    }

    const bundleName = this.extractBundleName(frame.fileName);
    const sourceMap = await this.getSourceMap(appId, appVersion, bundleName);

    if (!sourceMap) {
      return frame;
    }

    try {
      const position = originalPositionFor(sourceMap, {
        line: frame.lineNumber,
        column: frame.columnNumber ?? 0,
      });

      // If we couldn't resolve, return original frame
      if (!position.source) {
        return frame;
      }

      return {
        ...frame,
        originalFileName: position.source,
        originalLineNumber: position.line,
        originalColumnNumber: position.column,
        originalFunctionName: position.name ?? frame.functionName,
        resolved: true,
      };
    } catch (error) {
      console.error(`Failed to resolve frame:`, error);
      return frame;
    }
  }

  /**
   * Resolve all frames in a parsed stack trace.
   */
  async resolveStack(
    parsedStack: ParsedStackTrace,
    appId: string,
    appVersion: string
  ): Promise<ParsedStackTrace> {
    const resolvedFrames = await Promise.all(
      parsedStack.frames.map((frame) =>
        this.resolveFrame(frame, appId, appVersion)
      )
    );

    return {
      ...parsedStack,
      frames: resolvedFrames,
    };
  }

  /**
   * Check if source maps are available for an app version.
   */
  async hasSourceMaps(appId: string, appVersion: string): Promise<boolean> {
    const maps = await clickhouseClient.listSourceMaps(appId, appVersion);
    return maps.length > 0;
  }

  /**
   * Clear the cache for a specific app/version or entire cache.
   */
  clearCache(appId?: string, appVersion?: string): void {
    if (!appId) {
      this.cache.clear();
      return;
    }

    const prefix = appVersion ? `${appId}:${appVersion}:` : `${appId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const sourceMapService = new SourceMapService();
