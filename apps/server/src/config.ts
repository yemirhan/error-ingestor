export const config = {
  port: parseInt(process.env["PORT"] ?? "3000", 10),

  clickhouse: {
    host: process.env["CLICKHOUSE_HOST"] ?? "http://localhost:8123",
    username: process.env["CLICKHOUSE_USER"] ?? "default",
    password: process.env["CLICKHOUSE_PASSWORD"] ?? "",
    database: process.env["CLICKHOUSE_DATABASE"] ?? "error_ingestor",
  },
} as const;
