# @error-ingestor/server

Hono-based API server for error ingestion. Receives errors from client applications and stores them in ClickHouse for analysis.

## Quick Start

### 1. Start ClickHouse

```bash
# From the project root
docker compose up -d
```

### 2. Set Up Database

```bash
pnpm --filter @error-ingestor/server db:setup
```

### 3. Start the Server

```bash
# Development (with hot reload)
pnpm --filter @error-ingestor/server dev

# Production
pnpm --filter @error-ingestor/server build
pnpm --filter @error-ingestor/server start
```

Server runs at `http://localhost:3000`.

## Environment Variables

Create a `.env` file or set these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `CLICKHOUSE_HOST` | `http://localhost:8123` | ClickHouse HTTP endpoint |
| `CLICKHOUSE_USER` | `default` | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | (empty) | ClickHouse password |
| `CLICKHOUSE_DATABASE` | `error_ingestor` | Database name |

## API Endpoints

### Health Check

#### `GET /health`

Full health check including dependencies.

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "clickhouse": "up"
  }
}
```

#### `GET /health/live`

Liveness probe (always returns 200 if server is running).

#### `GET /health/ready`

Readiness probe (503 if ClickHouse is unavailable).

---

### Error Ingestion (Protected)

All `/api/*` routes require the `X-API-Key` header.

#### `POST /api/v1/ingest`

Batch ingest error events.

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "network/request-failed",
      "message": "Failed to fetch user data",
      "stackTrace": "Error: Failed to fetch...",
      "appId": "com.example.app",
      "appVersion": "1.0.0",
      "platform": "ios",
      "platformVersion": "17.0",
      "userId": "user-123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "metadata": {
        "endpoint": "/api/users",
        "statusCode": 500
      },
      "tags": {
        "severity": "high"
      }
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "accepted": 1
}
```

**Response (400 - Invalid app ID):**
```json
{
  "success": false,
  "error": "Some events do not match authenticated app. Expected appId: com.example.app"
}
```

#### `GET /api/v1/ingest/test`

Test API key validity.

```bash
curl -H "X-API-Key: ei_test_key_12345" http://localhost:3000/api/v1/ingest/test
```

Response:
```json
{
  "success": true,
  "appId": "test-app",
  "appName": "Test Application"
}
```

---

### Dashboard API

These endpoints power the dashboard UI.

#### `GET /dashboard/api/errors`

Query error events with filters.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `appId` | string | Yes | Application ID |
| `startTime` | ISO datetime | No | Start of time range (default: 24h ago) |
| `endTime` | ISO datetime | No | End of time range (default: now) |
| `code` | string | No | Filter by error code |
| `userId` | string | No | Filter by user ID |
| `limit` | number | No | Results per page (default: 100, max: 1000) |
| `offset` | number | No | Pagination offset |

```bash
curl "http://localhost:3000/dashboard/api/errors?appId=test-app&limit=10"
```

Response:
```json
{
  "success": true,
  "errors": [
    {
      "id": "...",
      "code": "network/request-failed",
      "message": "...",
      "timestamp": "2024-01-15T10:30:00.000Z",
      ...
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### `GET /dashboard/api/trends`

Get error trends over time.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `appId` | string | Yes | Application ID |
| `startTime` | ISO datetime | No | Start of time range (default: 7 days ago) |
| `endTime` | ISO datetime | No | End of time range (default: now) |
| `granularity` | `hour` \| `day` | No | Time bucket size (default: hour) |

```bash
curl "http://localhost:3000/dashboard/api/trends?appId=test-app&granularity=day"
```

Response:
```json
{
  "success": true,
  "trends": [
    {
      "time": "2024-01-14T00:00:00.000Z",
      "count": 42,
      "uniqueCodes": 5,
      "affectedUsers": 12
    },
    ...
  ]
}
```

#### `GET /dashboard/api/codes`

Get all error codes for an app with counts.

```bash
curl "http://localhost:3000/dashboard/api/codes?appId=test-app"
```

Response:
```json
{
  "success": true,
  "codes": [
    { "code": "network/request-failed", "count": 156 },
    { "code": "auth/session-expired", "count": 89 },
    ...
  ]
}
```

#### `GET /dashboard/api/apps`

List registered applications.

```bash
curl http://localhost:3000/dashboard/api/apps
```

Response:
```json
{
  "success": true,
  "apps": [
    {
      "id": "test-app",
      "name": "Test Application",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Authentication

### API Keys

The server uses API key authentication for the ingestion endpoint.

**Test API Key (Development):**
```
ei_test_key_12345
```

**Using the API Key:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ei_test_key_12345" \
  -d '{"events": [...]}' \
  http://localhost:3000/api/v1/ingest
```

### Generating API Keys (Production)

In production, implement the `registerApp` function in `src/middleware/auth.ts`:

```typescript
import { registerApp } from './middleware/auth';

// Register a new app and get its API key
const { apiKey } = registerApp('com.example.app', 'My Application');
console.log('API Key:', apiKey); // ei_abc123...
```

---

## Database Schema

The server uses ClickHouse with the following schema:

### `error_events` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique event ID |
| `code` | LowCardinality(String) | Error code |
| `message` | String | Error message |
| `stack_trace` | String | Stack trace |
| `app_id` | LowCardinality(String) | Application ID |
| `app_version` | LowCardinality(String) | App version |
| `platform` | LowCardinality(String) | ios/android/web |
| `platform_version` | LowCardinality(String) | Platform version |
| `user_id` | Nullable(String) | User ID |
| `timestamp` | DateTime64(3) | Event timestamp |
| `metadata` | String (JSON) | Additional data |
| `tags` | Map(String, String) | Tags/labels |

Data is partitioned by month and has a 90-day TTL.

---

## Deployment

### Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["node", "dist/index.js"]
```

### Vercel / Cloudflare Workers

The server is built with Hono, which supports multiple runtimes. Export the app for your platform:

```typescript
// For Vercel Edge
export const runtime = 'edge';
export default app;

// For Cloudflare Workers
export default {
  fetch: app.fetch,
};
```

### Environment Setup

For production:

1. Set up a ClickHouse cluster (or use ClickHouse Cloud)
2. Configure environment variables
3. Implement proper API key storage (database instead of in-memory)
4. Add rate limiting
5. Enable HTTPS

---

## Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck

# Run database setup
pnpm db:setup
```
