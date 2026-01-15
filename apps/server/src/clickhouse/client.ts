import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ResultAsync } from "neverthrow";
import type {
  ErrorEvent,
  ErrorQuery,
  ErrorTrendQuery,
  ErrorTrendPoint,
  StackFrame,
} from "@error-ingestor/shared";
import { config } from "../config";

/** Source map record for storage */
export interface SourceMapRecord {
  appId: string;
  appVersion: string;
  fileName: string;
  sourceMap: string;
}

class ClickHouseService {
  private client: ClickHouseClient;
  private hasStackColumns: boolean | null = null;

  constructor() {
    this.client = createClient({
      host: config.clickhouse.host,
      username: config.clickhouse.username,
      password: config.clickhouse.password,
      database: config.clickhouse.database,
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the new stack trace columns exist in the error_events table.
   * Caches the result for performance.
   */
  private async checkStackColumns(): Promise<boolean> {
    if (this.hasStackColumns !== null) {
      return this.hasStackColumns;
    }

    try {
      const result = await this.client.query({
        query: `
          SELECT name FROM system.columns
          WHERE database = {database:String}
            AND table = 'error_events'
            AND name = 'parsed_stack_frames'
        `,
        query_params: { database: config.clickhouse.database },
        format: "JSONEachRow",
      });
      const rows = await result.json<Array<{ name: string }>>();
      this.hasStackColumns = rows.length > 0;
    } catch {
      this.hasStackColumns = false;
    }

    return this.hasStackColumns;
  }

  insertEvents(events: ErrorEvent[]): ResultAsync<void, Error> {
    return ResultAsync.fromPromise(
      this.insertEventsAsync(events),
      (e) => new Error(`ClickHouse insert failed: ${e}`)
    ).map(() => undefined);
  }

  private async insertEventsAsync(events: ErrorEvent[]): Promise<void> {
    const hasStackCols = await this.checkStackColumns();

    // Format events for ClickHouse insert
    const rows = events.map((e) => {
      const baseRow = {
        id: e.id,
        code: e.code,
        message: e.message,
        stack_trace: e.stackTrace,
        app_id: e.appId,
        app_version: e.appVersion,
        platform: e.platform,
        platform_version: e.platformVersion,
        user_id: e.userId ?? null,
        // Convert ISO timestamp to ClickHouse format (remove Z suffix)
        timestamp: e.timestamp.replace("Z", "").replace("T", " "),
        // Metadata as JSON string
        metadata: JSON.stringify(e.metadata ?? {}),
        // Tags as object for Map type
        tags: e.tags ?? {},
      };

      // Only include stack columns if they exist in the schema
      if (hasStackCols) {
        return {
          ...baseRow,
          parsed_stack_frames: e.parsedStack?.frames.map((f) => [
            f.functionName,
            f.fileName,
            f.lineNumber,
            f.columnNumber,
            f.inApp,
            f.raw,
            f.originalFileName ?? null,
            f.originalLineNumber ?? null,
            f.originalColumnNumber ?? null,
            f.originalFunctionName ?? null,
            f.resolved ?? false,
          ]) ?? [],
          stack_parser: e.parsedStack?.parser ?? "unknown",
        };
      }

      return baseRow;
    });

    await this.client.insert({
      table: "error_events",
      values: rows,
      format: "JSONEachRow",
    });
  }

  async queryErrors(params: ErrorQuery): Promise<ErrorEvent[]> {
    const hasStackCols = await this.checkStackColumns();

    const conditions = [
      "app_id = {appId:String}",
      "timestamp >= {startTime:DateTime64(3)}",
      "timestamp <= {endTime:DateTime64(3)}",
    ];

    if (params.code) {
      conditions.push("code = {code:String}");
    }
    if (params.userId) {
      conditions.push("user_id = {userId:String}");
    }

    // Base columns
    const columns = [
      "id",
      "code",
      "message",
      "stack_trace as stackTrace",
      "app_id as appId",
      "app_version as appVersion",
      "platform",
      "platform_version as platformVersion",
      "user_id as userId",
      "timestamp",
      "metadata",
      "tags",
    ];

    // Add stack columns if they exist
    if (hasStackCols) {
      columns.push("parsed_stack_frames", "stack_parser");
    }

    const query = `
      SELECT ${columns.join(", ")}
      FROM error_events
      WHERE ${conditions.join(" AND ")}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32}
      OFFSET {offset:UInt32}
    `;

    const result = await this.client.query({
      query,
      query_params: {
        appId: params.appId,
        startTime: params.startTime.replace("Z", ""),
        endTime: params.endTime.replace("Z", ""),
        code: params.code ?? "",
        userId: params.userId ?? "",
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
      },
      format: "JSONEachRow",
    });

    type RawRow = ErrorEvent & {
      metadata: string;
      parsed_stack_frames?: Array<
        [
          string | null,
          string | null,
          number | null,
          number | null,
          boolean,
          string,
          string | null,
          number | null,
          number | null,
          string | null,
          boolean
        ]
      >;
      stack_parser?: string;
    };

    const rows = await result.json<RawRow[]>();

    return rows.map((row) => {
      // Convert parsed stack frames from tuple array back to objects (if available)
      const frames: StackFrame[] = (row.parsed_stack_frames ?? []).map((f) => ({
        functionName: f[0],
        fileName: f[1],
        lineNumber: f[2],
        columnNumber: f[3],
        inApp: f[4],
        raw: f[5],
        originalFileName: f[6],
        originalLineNumber: f[7],
        originalColumnNumber: f[8],
        originalFunctionName: f[9],
        resolved: f[10],
      }));

      return {
        ...row,
        metadata:
          typeof row.metadata === "string"
            ? JSON.parse(row.metadata)
            : row.metadata,
        parsedStack:
          frames.length > 0
            ? {
                frames,
                raw: row.stackTrace,
                parser: (row.stack_parser ?? "unknown") as "browser" | "react-native" | "node" | "unknown",
              }
            : undefined,
      };
    });
  }

  async getErrorTrends(params: ErrorTrendQuery): Promise<ErrorTrendPoint[]> {
    const timeColumn =
      params.granularity === "hour"
        ? "toStartOfHour(timestamp)"
        : "toDate(timestamp)";

    const query = `
      SELECT
        ${timeColumn} as time,
        count() as count,
        uniqExact(code) as uniqueCodes,
        uniqExact(user_id) as affectedUsers
      FROM error_events
      WHERE app_id = {appId:String}
        AND timestamp >= {startTime:DateTime64(3)}
        AND timestamp <= {endTime:DateTime64(3)}
      GROUP BY time
      ORDER BY time
    `;

    const result = await this.client.query({
      query,
      query_params: {
        appId: params.appId,
        startTime: params.startTime.replace("Z", ""),
        endTime: params.endTime.replace("Z", ""),
      },
      format: "JSONEachRow",
    });

    return await result.json<ErrorTrendPoint[]>();
  }

  async getErrorCodes(appId: string): Promise<Array<{ code: string; count: number }>> {
    const query = `
      SELECT
        code,
        count() as count
      FROM error_events
      WHERE app_id = {appId:String}
      GROUP BY code
      ORDER BY count DESC
      LIMIT 100
    `;

    const result = await this.client.query({
      query,
      query_params: { appId },
      format: "JSONEachRow",
    });

    return await result.json<Array<{ code: string; count: number }>>();
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  // Source map operations

  insertSourceMap(record: SourceMapRecord): ResultAsync<void, Error> {
    const row = {
      app_id: record.appId,
      app_version: record.appVersion,
      file_name: record.fileName,
      source_map: record.sourceMap,
    };

    return ResultAsync.fromPromise(
      this.client.insert({
        table: "source_maps",
        values: [row],
        format: "JSONEachRow",
      }),
      (e) => new Error(`ClickHouse source map insert failed: ${e}`)
    ).map(() => undefined);
  }

  async getSourceMap(
    appId: string,
    appVersion: string,
    fileName: string
  ): Promise<string | null> {
    const query = `
      SELECT source_map
      FROM source_maps
      WHERE app_id = {appId:String}
        AND app_version = {appVersion:String}
        AND file_name = {fileName:String}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.client.query({
      query,
      query_params: { appId, appVersion, fileName },
      format: "JSONEachRow",
    });

    const rows = await result.json<Array<{ source_map: string }>>();
    return rows.length > 0 ? rows[0].source_map : null;
  }

  async listSourceMaps(
    appId: string,
    appVersion?: string
  ): Promise<Array<{ fileName: string; appVersion: string; createdAt: string }>> {
    const conditions = ["app_id = {appId:String}"];
    if (appVersion) {
      conditions.push("app_version = {appVersion:String}");
    }

    const query = `
      SELECT
        file_name as fileName,
        app_version as appVersion,
        created_at as createdAt
      FROM source_maps
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
    `;

    const result = await this.client.query({
      query,
      query_params: { appId, appVersion: appVersion ?? "" },
      format: "JSONEachRow",
    });

    return await result.json<
      Array<{ fileName: string; appVersion: string; createdAt: string }>
    >();
  }

  async deleteSourceMaps(appId: string, appVersion: string): Promise<void> {
    const query = `
      ALTER TABLE source_maps
      DELETE WHERE app_id = {appId:String} AND app_version = {appVersion:String}
    `;

    await this.client.command({
      query,
      query_params: { appId, appVersion },
    });
  }
}

export const clickhouseClient = new ClickHouseService();
