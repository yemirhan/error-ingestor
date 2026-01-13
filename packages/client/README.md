# @error-ingestor/client

Client SDK for capturing and reporting errors to your Error Ingestor server. Works with React Native (iOS/Android) and web applications.

## Installation

```bash
npm install @error-ingestor/client
# or
pnpm add @error-ingestor/client
# or
yarn add @error-ingestor/client
```

## Quick Start

```typescript
import { ErrorIngestor, ErrorBoundary } from '@error-ingestor/client';

// 1. Initialize at app startup
ErrorIngestor.init({
  apiKey: 'your-api-key',
  appId: 'com.yourcompany.app',
  appVersion: '1.0.0',
  endpoint: 'https://errors.yourcompany.com',
});

// 2. Wrap your app with ErrorBoundary
export default function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <MainApp />
    </ErrorBoundary>
  );
}
```

## Configuration

### `ErrorIngestor.init(config)`

Initialize the client. Must be called once before capturing errors.

```typescript
interface ErrorIngestorConfig {
  // Required
  apiKey: string;      // API key from your server
  appId: string;       // Unique app identifier (e.g., bundle ID)
  appVersion: string;  // Current app version
  endpoint: string;    // Error Ingestor server URL

  // Optional
  userId?: string;       // User ID for tracking (can be set later)
  batchSize?: number;    // Errors per batch (default: 10)
  flushInterval?: number; // Auto-flush interval in ms (default: 5000)
  maxRetries?: number;   // Retry attempts on failure (default: 3)
  debug?: boolean;       // Enable console logging (default: false)
}

// Example
ErrorIngestor.init({
  apiKey: 'ei_abc123',
  appId: 'com.example.myapp',
  appVersion: '2.1.0',
  endpoint: 'https://errors.example.com',
  userId: 'user-123',
  batchSize: 20,
  flushInterval: 10000,
  debug: __DEV__, // Enable in development
});
```

## API Reference

### `ErrorIngestor.capture(error, options?)`

Capture an error and queue it for sending.

```typescript
import { ErrorIngestor, AppError, ErrorCodes } from '@error-ingestor/client';

// Capture a standard Error
try {
  await fetchData();
} catch (error) {
  ErrorIngestor.capture(error);
}

// Capture with metadata
ErrorIngestor.capture(error, {
  metadata: {
    userId: 'user-123',
    action: 'checkout',
    cartItems: 3,
  },
  tags: {
    severity: 'critical',
    component: 'PaymentForm',
  },
});

// Capture a custom AppError
const error = new AppError(
  ErrorCodes.NETWORK_ERROR,
  'Failed to connect to payment gateway'
);
ErrorIngestor.capture(error);
```

### `ErrorIngestor.setUserId(userId)`

Set or update the user ID for future errors.

```typescript
// After user logs in
ErrorIngestor.setUserId('user-456');

// After user logs out
ErrorIngestor.setUserId(null);
```

### `ErrorIngestor.flush()`

Force send all queued errors immediately.

```typescript
// Before app closes or user logs out
await ErrorIngestor.flush();
```

### `ErrorIngestor.isReady()`

Check if the client is initialized.

```typescript
if (ErrorIngestor.isReady()) {
  ErrorIngestor.capture(error);
}
```

### `ErrorIngestor.getQueueSize()`

Get the number of errors waiting to be sent.

```typescript
const pending = ErrorIngestor.getQueueSize();
console.log(`${pending} errors in queue`);
```

### `ErrorIngestor.destroy()`

Cleanup and flush remaining errors.

```typescript
// On app shutdown
ErrorIngestor.destroy();
```

## ErrorBoundary Component

A React Error Boundary that automatically captures and reports errors.

```typescript
import { ErrorBoundary } from '@error-ingestor/client';

// Basic usage
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>

// With render function (access error and reset)
<ErrorBoundary
  fallback={(error, reset) => (
    <View>
      <Text>Something went wrong: {error.message}</Text>
      <Button title="Try Again" onPress={reset} />
    </View>
  )}
  onError={(error, errorInfo) => {
    // Additional error handling
    console.log('Component stack:', errorInfo.componentStack);
  }}
  onReset={() => {
    // Called when reset() is invoked
    navigation.navigate('Home');
  }}
>
  <App />
</ErrorBoundary>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content to render |
| `fallback` | `ReactNode \| (error, reset) => ReactNode` | UI to show on error |
| `onError` | `(error, errorInfo) => void` | Optional error callback |
| `onReset` | `() => void` | Optional reset callback |

## Custom Error Codes

Define your own error codes for better categorization.

```typescript
import { AppError } from '@error-ingestor/client';

// Define custom codes
const MyErrorCodes = {
  PAYMENT_FAILED: 'payment/failed',
  PAYMENT_TIMEOUT: 'payment/timeout',
  CART_EMPTY: 'cart/empty',
  INVENTORY_LOW: 'inventory/low-stock',
} as const;

// Use custom codes
const error = new AppError(
  MyErrorCodes.PAYMENT_FAILED,
  'Credit card was declined'
);
ErrorIngestor.capture(error);
```

### Built-in Error Codes

```typescript
import { ErrorCodes } from '@error-ingestor/client';

ErrorCodes.USER_NOT_FOUND        // 'auth/user-not-found'
ErrorCodes.USER_NOT_AUTHENTICATED // 'auth/user-not-authenticated'
ErrorCodes.INVALID_CREDENTIALS   // 'auth/invalid-credentials'
ErrorCodes.NETWORK_ERROR         // 'network/request-failed'
ErrorCodes.TIMEOUT               // 'network/timeout'
ErrorCodes.VALIDATION_ERROR      // 'validation/invalid-input'
ErrorCodes.UNKNOWN               // 'unknown/unhandled'
```

## Using with Neverthrow

The client works great with [neverthrow](https://github.com/supermacro/neverthrow) for type-safe error handling.

```typescript
import { Result, ok, err } from 'neverthrow';
import { ErrorIngestor, AppError, ErrorCodes } from '@error-ingestor/client';

// Define a function that returns Result
async function fetchUser(id: string): Promise<Result<User, AppError>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      const error = new AppError(
        ErrorCodes.FETCH_FAILED,
        `Failed to fetch user: ${response.status}`
      );
      ErrorIngestor.capture(error);
      return err(error);
    }

    return ok(await response.json());
  } catch (e) {
    const error = new AppError(ErrorCodes.NETWORK_ERROR, 'Network request failed');
    ErrorIngestor.capture(error);
    return err(error);
  }
}

// Usage
const result = await fetchUser('123');

result
  .map(user => {
    // Handle success
    console.log('User:', user.name);
  })
  .mapErr(error => {
    // Handle error (already captured)
    showToast(error.message);
  });
```

## TypeScript Types

```typescript
import type {
  ErrorIngestorConfig,
  CaptureOptions,
  ErrorEvent,
  ErrorCode,
} from '@error-ingestor/client';

// CaptureOptions
interface CaptureOptions {
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
  userId?: string;
}

// ErrorEvent (what gets sent to the server)
interface ErrorEvent {
  id: string;
  code: string;
  message: string;
  stackTrace: string;
  appId: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
  platformVersion: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
}
```

## Platform Support

| Platform | Supported | Notes |
|----------|-----------|-------|
| React Native (iOS) | Yes | Expo and bare workflow |
| React Native (Android) | Yes | Expo and bare workflow |
| Web (React) | Yes | Any React web app |
| Next.js | Yes | Client components only |
| Node.js | Partial | Manual capture only (no ErrorBoundary) |

## Best Practices

1. **Initialize early**: Call `init()` as soon as possible in your app lifecycle.
2. **Use ErrorBoundary**: Wrap your root component to catch React errors automatically.
3. **Add context**: Include relevant metadata (user actions, screen name, etc.).
4. **Use custom error codes**: Create semantic codes for your domain.
5. **Flush on logout**: Call `flush()` before clearing user session.

```typescript
// Example: Full setup in React Native
import { ErrorIngestor, ErrorBoundary } from '@error-ingestor/client';

// Initialize in index.js or App.tsx
ErrorIngestor.init({
  apiKey: process.env.ERROR_INGESTOR_API_KEY,
  appId: 'com.example.app',
  appVersion: require('./package.json').version,
  endpoint: process.env.ERROR_INGESTOR_ENDPOINT,
  debug: __DEV__,
});

export default function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorScreen error={error} onRetry={reset} />
      )}
    >
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ErrorBoundary>
  );
}
```
