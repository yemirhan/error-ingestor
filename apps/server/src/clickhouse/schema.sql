-- Error Ingestor ClickHouse Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS error_ingestor;

-- Main error events table
CREATE TABLE IF NOT EXISTS error_ingestor.error_events (
    id UUID,
    code LowCardinality(String),
    message String,
    stack_trace String,
    app_id LowCardinality(String),
    app_version LowCardinality(String),
    platform LowCardinality(String),
    platform_version LowCardinality(String),
    user_id Nullable(String),
    timestamp DateTime64(3),
    metadata String DEFAULT '{}',
    tags Map(String, String),

    -- Parsed stack trace data
    parsed_stack_frames Array(Tuple(
        function_name Nullable(String),
        file_name Nullable(String),
        line_number Nullable(Int32),
        column_number Nullable(Int32),
        in_app Bool,
        raw String,
        original_file_name Nullable(String),
        original_line_number Nullable(Int32),
        original_column_number Nullable(Int32),
        original_function_name Nullable(String),
        resolved Bool
    )) DEFAULT [],
    stack_parser LowCardinality(String) DEFAULT 'unknown',

    -- Derived columns for efficient querying
    date Date DEFAULT toDate(timestamp),
    hour DateTime DEFAULT toStartOfHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (app_id, code, timestamp, id)
TTL date + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- Materialized view for error counts by code and hour
CREATE MATERIALIZED VIEW IF NOT EXISTS error_ingestor.error_counts_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (app_id, code, hour)
AS SELECT
    app_id,
    code,
    toStartOfHour(timestamp) AS hour,
    count() AS error_count,
    uniqExact(user_id) AS affected_users
FROM error_ingestor.error_events
GROUP BY app_id, code, hour;

-- Materialized view for daily summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS error_ingestor.error_counts_daily
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (app_id, date)
AS SELECT
    app_id,
    toDate(timestamp) AS date,
    count() AS total_errors,
    uniqExact(code) AS unique_error_codes,
    uniqExact(user_id) AS affected_users
FROM error_ingestor.error_events
GROUP BY app_id, date;

-- Apps table for registered applications
CREATE TABLE IF NOT EXISTS error_ingestor.apps (
    id String,
    name String,
    api_key_hash String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY id;

-- Source maps table for storing uploaded source maps
CREATE TABLE IF NOT EXISTS error_ingestor.source_maps (
    id UUID DEFAULT generateUUIDv4(),
    app_id LowCardinality(String),
    app_version LowCardinality(String),
    file_name String,
    source_map String,
    created_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(created_at)
ORDER BY (app_id, app_version, file_name);

-- Migration: Add parsed stack columns to error_events
-- Run these ALTER statements if upgrading from an existing installation:
--
-- ALTER TABLE error_ingestor.error_events
-- ADD COLUMN IF NOT EXISTS parsed_stack_frames Array(Tuple(
--     function_name Nullable(String),
--     file_name Nullable(String),
--     line_number Nullable(Int32),
--     column_number Nullable(Int32),
--     in_app Bool,
--     raw String,
--     original_file_name Nullable(String),
--     original_line_number Nullable(Int32),
--     original_column_number Nullable(Int32),
--     original_function_name Nullable(String),
--     resolved Bool
-- )) DEFAULT [];
--
-- ALTER TABLE error_ingestor.error_events
-- ADD COLUMN IF NOT EXISTS stack_parser LowCardinality(String) DEFAULT 'unknown';
