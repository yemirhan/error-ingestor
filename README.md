# Error Ingestor

A lightweight, type-safe error tracking library for JavaScript/TypeScript applications. Capture, ingest, and analyze errors from your React Native and web applications.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │  Ingestor API   │     │   ClickHouse    │
│                 │────▶│    (Hono)       │────▶│   (Storage)     │
│ @error-ingestor │     │                 │     │                 │
│    /client      │     │  /api/v1/ingest │     │  error_events   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │    Dashboard    │
                                               │     (React)     │
                                               └─────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| [`@error-ingestor/client`](./packages/client) | Client SDK for capturing errors |
| [`@error-ingestor/server`](./apps/server) | Hono API server for error ingestion |
| [`@error-ingestor/dashboard`](./apps/dashboard) | React dashboard for viewing errors |
| [`@error-ingestor/shared`](./packages/shared) | Shared types and schemas |

## Quick Start

### 1. Start the Server

```bash
# Clone the repo
git clone https://github.com/your-org/error-ingestor.git
cd error-ingestor

# Install dependencies
pnpm install

# Start ClickHouse
docker compose up -d

# Set up the database schema
pnpm --filter @error-ingestor/server db:setup

# Start all services (server + dashboard)
pnpm dev
```

The server runs at `http://localhost:3000` and the dashboard at `http://localhost:5173`.

### 2. Install the Client

```bash
npm install @error-ingestor/client
# or
pnpm add @error-ingestor/client
```

### 3. Initialize in Your App

```typescript
import { ErrorIngestor, ErrorBoundary } from '@error-ingestor/client';

// Initialize once at app startup
ErrorIngestor.init({
  apiKey: 'ei_test_key_12345',  // Get from your server
  appId: 'com.yourcompany.app',
  appVersion: '1.0.0',
  endpoint: 'http://localhost:3000',
});

// Wrap your app with ErrorBoundary
function App() {
  return (
    <ErrorBoundary fallback={<ErrorScreen />}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 4. Capture Errors

```typescript
import { ErrorIngestor, AppError, ErrorCodes } from '@error-ingestor/client';

// Automatic capture via ErrorBoundary (React errors)

// Manual capture
try {
  await riskyOperation();
} catch (error) {
  ErrorIngestor.capture(error);
}

// With custom error codes
const error = new AppError(ErrorCodes.NETWORK_ERROR, 'Failed to fetch data');
ErrorIngestor.capture(error, {
  metadata: { endpoint: '/api/users' },
  tags: { severity: 'high' },
});
```

## Examples

Check out the example applications:

- **[React Native (Expo)](./examples/react-native-app)** - Mobile app with error boundaries and manual capture
- **[Next.js](./examples/nextjs-app)** - Web app with App Router error handling

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm dev

# Type check
pnpm typecheck
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=error_ingestor
```

## API Reference

### Client SDK

See [`packages/client/README.md`](./packages/client/README.md) for full API documentation.

### Server API

See [`apps/server/README.md`](./apps/server/README.md) for endpoint documentation.

## License

MIT
