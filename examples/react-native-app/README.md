# React Native Example (Expo)

This example demonstrates how to integrate `@error-ingestor/client` in a React Native app using Expo.

## Features Demonstrated

- ErrorIngestor initialization
- ErrorBoundary for catching React errors
- Manual error capture with custom codes
- API error handling with Neverthrow
- Queue management (check size, flush)
- User ID tracking

## Setup

### 1. Start the Error Ingestor Server

First, make sure the Error Ingestor server is running:

```bash
# From the project root
cd ../..
docker compose up -d
pnpm --filter @error-ingestor/server db:setup
pnpm --filter @error-ingestor/server dev
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the App

```bash
pnpm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## Project Structure

```
react-native-app/
├── app/
│   ├── _layout.tsx        # Root layout with ErrorIngestor init
│   └── index.tsx          # Home screen route
├── src/
│   ├── components/
│   │   └── ErrorFallback.tsx  # Error UI component
│   ├── screens/
│   │   └── HomeScreen.tsx     # Main demo screen
│   └── services/
│       ├── api.ts             # API calls with error handling
│       └── errors.ts          # Custom error codes
└── package.json
```

## Key Implementation Details

### Initialization (`app/_layout.tsx`)

```typescript
import { ErrorIngestor, ErrorBoundary } from '@error-ingestor/client';

// Initialize early in your app
ErrorIngestor.init({
  apiKey: 'ei_test_key_12345',
  appId: 'com.example.erroringestor',
  appVersion: '1.0.0',
  endpoint: 'http://localhost:3000',
  debug: __DEV__,
});

// Wrap your app
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Custom Error Codes (`src/services/errors.ts`)

```typescript
import { AppError } from '@error-ingestor/client';

export const AppErrorCodes = {
  API_REQUEST_FAILED: 'api/request-failed',
  API_TIMEOUT: 'api/timeout',
  // ...
} as const;

export const AppErrors = {
  apiRequestFailed: (endpoint: string) =>
    new AppError(AppErrorCodes.API_REQUEST_FAILED, `API request failed`),
};
```

### Error Handling with Neverthrow (`src/services/api.ts`)

```typescript
import { Result, ok, err } from 'neverthrow';
import { ErrorIngestor, AppError } from '@error-ingestor/client';

async function fetchData(): Promise<Result<Data, AppError>> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      const error = new AppError('api/error', 'Request failed');
      ErrorIngestor.capture(error);
      return err(error);
    }
    return ok(await response.json());
  } catch (e) {
    const error = new AppError('network/error', 'Network failed');
    ErrorIngestor.capture(error);
    return err(error);
  }
}
```

## Testing Error Scenarios

The app includes buttons to test different scenarios:

1. **Manual Capture** - Captures a custom error with metadata
2. **API Error (500)** - Simulates a server error
3. **Timeout** - Simulates a request timeout
4. **Successful API** - Makes a real API call
5. **Crash** - Throws an unhandled error (caught by ErrorBoundary)
6. **Check Queue** - Shows pending errors count
7. **Flush** - Forces immediate send of queued errors

## Viewing Errors

After triggering some errors:

1. Open the dashboard at `http://localhost:5173`
2. Select "Test Application" from the app dropdown
3. View your captured errors with full details

## Configuration Options

```typescript
ErrorIngestor.init({
  apiKey: string;        // Required
  appId: string;         // Required
  appVersion: string;    // Required
  endpoint: string;      // Required
  userId?: string;       // Optional user tracking
  batchSize?: number;    // Default: 10
  flushInterval?: number; // Default: 5000ms
  maxRetries?: number;   // Default: 3
  debug?: boolean;       // Default: false
});
```
