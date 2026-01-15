# Next.js Example - Error Ingestor

A Next.js 15 (App Router) example demonstrating error tracking with `@error-ingestor/client`.

## Prerequisites

- Node.js 18+
- Error Ingestor server running on `http://localhost:3001`
- API key from the server

## Setup

1. **Install dependencies:**

```bash
cd examples/nextjs-app
pnpm install
```

2. **Configure environment:**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_ERROR_INGESTOR_ENDPOINT=http://localhost:3001
NEXT_PUBLIC_ERROR_INGESTOR_API_KEY=your-api-key
NEXT_PUBLIC_ERROR_INGESTOR_APP_ID=nextjs-demo
```

3. **Start the development server:**

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with Providers
│   ├── page.tsx             # Home page with demo UI
│   ├── error.tsx            # Error boundary (catches errors)
│   ├── global-error.tsx     # Global error handler
│   ├── globals.css          # Tailwind styles
│   └── api/
│       └── demo/route.ts    # Demo API endpoint
├── components/
│   ├── Providers.tsx        # Client-side providers wrapper
│   └── DemoButtons.tsx      # Error trigger buttons
└── lib/
    ├── error-ingestor.ts    # ErrorIngestor initialization
    └── errors.ts            # Custom error codes
```

## Features Demonstrated

### 1. Client-Side Initialization

The `Providers.tsx` component initializes ErrorIngestor on the client:

```tsx
"use client";

import { useEffect } from "react";
import { initErrorIngestor } from "@/lib/error-ingestor";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initErrorIngestor();
  }, []);

  return <>{children}</>;
}
```

### 2. Next.js Error Boundary Integration

The `error.tsx` file integrates with Next.js built-in error handling:

```tsx
"use client";

import { useEffect } from "react";
import { ErrorIngestor } from "@error-ingestor/client";

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    ErrorIngestor.capture(error, {
      tags: {
        source: "next-error-boundary",
        digest: error.digest || "unknown",
      },
    });
  }, [error]);

  return (
    // Error UI with reset button
  );
}
```

### 3. Custom Error Codes

Define application-specific error codes in `lib/errors.ts`:

```typescript
export const NextJsErrorCodes = {
  API_ERROR: "NEXTJS_API_ERROR",
  AUTH_ERROR: "NEXTJS_AUTH_ERROR",
  VALIDATION_ERROR: "NEXTJS_VALIDATION_ERROR",
  NETWORK_ERROR: "NEXTJS_NETWORK_ERROR",
} as const;
```

### 4. Manual Error Capture

Capture errors manually with custom metadata:

```typescript
import { ErrorIngestor } from "@error-ingestor/client";

try {
  await riskyOperation();
} catch (error) {
  ErrorIngestor.capture(error as Error, {
    tags: { operation: "data-fetch" },
    extra: { endpoint: "/api/data" },
  });
}
```

### 5. Async Error Handling

Handle errors from async operations:

```typescript
const handleAsyncError = async () => {
  try {
    const response = await fetch("/api/demo?error=true");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }
  } catch (error) {
    ErrorIngestor.capture(error as Error, {
      tags: { type: "api-error" },
    });
  }
};
```

### 6. Component Errors (Error Boundary)

Throw errors that will be caught by the error boundary:

```typescript
const handleComponentError = () => {
  // This error will be caught by error.tsx
  throw new Error("Component error for testing");
};
```

## Demo Buttons

The example includes several demo buttons:

| Button | Description |
|--------|-------------|
| **Throw Error** | Triggers a component error caught by `error.tsx` |
| **Capture Manual Error** | Manually captures an error without throwing |
| **API Error** | Calls `/api/demo?error=true` to test API error handling |
| **Unhandled Promise** | Creates an unhandled promise rejection |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ERROR_INGESTOR_ENDPOINT` | Server URL | Yes |
| `NEXT_PUBLIC_ERROR_INGESTOR_API_KEY` | API key for authentication | Yes |
| `NEXT_PUBLIC_ERROR_INGESTOR_APP_ID` | Application identifier | Yes |

## Testing Errors

1. **Start the server** (from repo root):
   ```bash
   pnpm dev --filter server
   ```

2. **Start the dashboard** (optional):
   ```bash
   pnpm dev --filter dashboard
   ```

3. **Start this example**:
   ```bash
   pnpm dev
   ```

4. **Trigger errors** using the demo buttons

5. **View errors** in the dashboard at [http://localhost:5173](http://localhost:5173)

## Production Build

```bash
pnpm build
pnpm start
```

## Server-Side Error Handling

For server components and API routes, consider using the server SDK or implementing custom error tracking:

```typescript
// In API route
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Your logic
  } catch (error) {
    // Log to external service or use server-side SDK
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Notes

- ErrorIngestor only runs on the client side in Next.js
- Use `error.tsx` for route-level error boundaries
- Use `global-error.tsx` for root layout errors
- Server components need separate error tracking (server SDK)
