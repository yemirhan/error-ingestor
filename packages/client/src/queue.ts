import { ResultAsync, ok, err } from "neverthrow";
import type { ErrorEvent } from "@error-ingestor/shared";

export interface QueueConfig {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  endpoint: string;
  apiKey: string;
  debug: boolean;
}

export class ErrorQueue {
  private queue: ErrorEvent[] = [];
  private retryQueue: ErrorEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private retryCount = 0;
  private isFlushing = false;

  constructor(private config: QueueConfig) {
    this.startFlushTimer();
  }

  add(event: ErrorEvent): void {
    this.queue.push(event);

    if (this.config.debug) {
      console.log("[ErrorIngestor] Event queued:", event.code);
    }

    if (this.queue.length >= this.config.batchSize) {
      void this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.config.flushInterval);
  }

  async flush(): Promise<void> {
    if (this.isFlushing) {
      return;
    }

    if (this.queue.length === 0 && this.retryQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    // Combine regular queue and retry queue
    const eventsToSend = [...this.retryQueue, ...this.queue];
    this.queue = [];
    this.retryQueue = [];

    if (this.config.debug) {
      console.log("[ErrorIngestor] Flushing", eventsToSend.length, "events");
    }

    const result = await this.sendBatch(eventsToSend);

    result
      .mapErr((error) => {
        if (this.config.debug) {
          console.warn("[ErrorIngestor] Flush failed:", error.message);
        }

        // On failure, add back to retry queue
        if (this.retryCount < this.config.maxRetries) {
          this.retryQueue.push(...eventsToSend);
          this.retryCount++;

          // Exponential backoff retry
          const delay = Math.pow(2, this.retryCount) * 1000;
          if (this.config.debug) {
            console.log(
              "[ErrorIngestor] Will retry in",
              delay,
              "ms (attempt",
              this.retryCount,
              ")"
            );
          }

          setTimeout(() => {
            void this.flush();
          }, delay);
        } else {
          console.error(
            "[ErrorIngestor] Max retries reached, dropping",
            eventsToSend.length,
            "events"
          );
        }
      })
      .map(() => {
        if (this.config.debug) {
          console.log(
            "[ErrorIngestor] Successfully sent",
            eventsToSend.length,
            "events"
          );
        }
        this.retryCount = 0;
      });

    this.isFlushing = false;
  }

  private sendBatch(events: ErrorEvent[]): ResultAsync<void, Error> {
    return ResultAsync.fromPromise(
      fetch(`${this.config.endpoint}/api/v1/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.config.apiKey,
        },
        body: JSON.stringify({ events }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }),
      (e) => (e instanceof Error ? e : new Error(String(e)))
    );
  }

  getQueueSize(): number {
    return this.queue.length + this.retryQueue.length;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush attempt (synchronous best-effort)
    if (this.queue.length > 0 || this.retryQueue.length > 0) {
      void this.flush();
    }
  }
}
