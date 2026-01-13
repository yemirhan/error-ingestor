import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Error Ingestor",
    default: "Error Ingestor Documentation",
  },
  description:
    "Comprehensive documentation for Error Ingestor - a lightweight error tracking solution for React and React Native applications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
