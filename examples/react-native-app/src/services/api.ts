import { Result, ok, err } from "neverthrow";
import { AppError, ErrorIngestor } from "@error-ingestor/client";
import { AppErrors } from "./errors";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
}

const API_BASE = "https://jsonplaceholder.typicode.com";

/**
 * Fetch a user by ID with proper error handling
 */
export async function fetchUser(userId: string): Promise<Result<User, AppError>> {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`);

    if (!response.ok) {
      if (response.status === 404) {
        const error = AppErrors.userNotFound(userId);
        ErrorIngestor.capture(error);
        return err(error);
      }

      const error = AppErrors.apiRequestFailed(`/users/${userId}`, response.status);
      ErrorIngestor.capture(error);
      return err(error);
    }

    const user = await response.json();
    return ok(user);
  } catch (e) {
    const error = AppErrors.apiRequestFailed(`/users/${userId}`);
    ErrorIngestor.capture(error, {
      metadata: { originalError: String(e) },
    });
    return err(error);
  }
}

/**
 * Fetch posts - simulates a slow/failing API
 */
export async function fetchPosts(
  options?: { simulateTimeout?: boolean; simulateError?: boolean }
): Promise<Result<Post[], AppError>> {
  try {
    // Simulate timeout
    if (options?.simulateTimeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const error = AppErrors.apiTimeout("/posts");
      ErrorIngestor.capture(error);
      return err(error);
    }

    // Simulate server error
    if (options?.simulateError) {
      const error = AppErrors.apiRequestFailed("/posts", 500);
      ErrorIngestor.capture(error, {
        tags: { simulated: "true" },
      });
      return err(error);
    }

    const response = await fetch(`${API_BASE}/posts?_limit=5`);

    if (!response.ok) {
      const error = AppErrors.apiRequestFailed("/posts", response.status);
      ErrorIngestor.capture(error);
      return err(error);
    }

    const posts = await response.json();
    return ok(posts);
  } catch (e) {
    const error = AppErrors.apiRequestFailed("/posts");
    ErrorIngestor.capture(error, {
      metadata: { originalError: String(e) },
    });
    return err(error);
  }
}
