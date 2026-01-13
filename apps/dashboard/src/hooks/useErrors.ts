import { useQuery } from "@tanstack/react-query";
import {
  fetchErrors,
  fetchTrends,
  fetchErrorCodes,
  fetchApps,
  type FetchErrorsParams,
  type FetchTrendsParams,
} from "../api/client";

export function useErrors(params: FetchErrorsParams) {
  return useQuery({
    queryKey: ["errors", params],
    queryFn: () => fetchErrors(params),
    enabled: !!params.appId,
  });
}

export function useTrends(params: FetchTrendsParams) {
  return useQuery({
    queryKey: ["trends", params],
    queryFn: () => fetchTrends(params),
    enabled: !!params.appId,
  });
}

export function useErrorCodes(appId: string) {
  return useQuery({
    queryKey: ["errorCodes", appId],
    queryFn: () => fetchErrorCodes(appId),
    enabled: !!appId,
  });
}

export function useApps() {
  return useQuery({
    queryKey: ["apps"],
    queryFn: fetchApps,
  });
}
