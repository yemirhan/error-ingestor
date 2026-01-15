import { createClient, ClickHouseClient } from "@clickhouse/client";
import { ResultAsync } from "neverthrow";
import type {
  ErrorEvent,
  ErrorQuery,
  ErrorTrendQuery,
  ErrorTrendPoint,
} from "@error-ingestor/shared";
import { config } from "../config";

class ClickHouseService {
  private client: ClickHouseClient;

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

  insertEvents(events: ErrorEvent[]): ResultAsync<void, Error> {
    // Format events for ClickHouse insert
    const rows = events.map((e) => ({
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
    }));

    return ResultAsync.fromPromise(
      this.client.insert({
        table: "error_events",
        values: rows,
        format: "JSONEachRow",
      }),
      (e) => new Error(`ClickHouse insert failed: ${e}`)
    ).map(() => undefined);
  }

  async queryErrors(params: ErrorQuery): Promise<ErrorEvent[]> {
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

    const query = `
      SELECT
        id,
        code,
        message,
        stack_trace as stackTrace,
        app_id as appId,
        app_version as appVersion,
        platform,
        platform_version as platformVersion,
        user_id as userId,
        timestamp,
        metadata,
        tags
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

    const rows = await result.json<
      Array<ErrorEvent & { metadata: string }>
    >();

    return rows.map((row) => ({
      ...row,
      metadata:
        typeof row.metadata === "string"
          ? JSON.parse(row.metadata)
          : row.metadata,
    }));
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
}

export const clickhouseClient = new ClickHouseService();
