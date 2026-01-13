import type { ErrorEvent, ErrorTrendPoint } from "@error-ingestor/shared";

const BASE_URL = "/dashboard/api";

export interface ErrorsResponse {
  success: boolean;
  errors: ErrorEvent[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TrendsResponse {
  success: boolean;
  trends: ErrorTrendPoint[];
}

export interface ErrorCodesResponse {
  success: boolean;
  codes: Array<{ code: string; count: number }>;
}

export interface AppsResponse {
  success: boolean;
  apps: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
}

export interface FetchErrorsParams {
  appId: string;
  startTime?: string;
  endTime?: string;
  code?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface FetchTrendsParams {
  appId: string;
  startTime?: string;
  endTime?: string;
  granularity?: "hour" | "day";
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchErrors(
  params: FetchErrorsParams
): Promise<ErrorsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("appId", params.appId);

  if (params.startTime) searchParams.set("startTime", params.startTime);
  if (params.endTime) searchParams.set("endTime", params.endTime);
  if (params.code) searchParams.set("code", params.code);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  return fetchJson(`${BASE_URL}/errors?${searchParams}`);
}

export async function fetchTrends(
  params: FetchTrendsParams
): Promise<TrendsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("appId", params.appId);

  if (params.startTime) searchParams.set("startTime", params.startTime);
  if (params.endTime) searchParams.set("endTime", params.endTime);
  if (params.granularity) searchParams.set("granularity", params.granularity);

  return fetchJson(`${BASE_URL}/trends?${searchParams}`);
}

export async function fetchErrorCodes(
  appId: string
): Promise<ErrorCodesResponse> {
  return fetchJson(`${BASE_URL}/codes?appId=${appId}`);
}

export async function fetchApps(): Promise<AppsResponse> {
  return fetchJson(`${BASE_URL}/apps`);
}
