"use client";

import { useEffect, type ReactNode } from "react";
import { initErrorIngestor } from "@/lib/error-ingestor";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    initErrorIngestor();
  }, []);

  return <>{children}</>;
}
