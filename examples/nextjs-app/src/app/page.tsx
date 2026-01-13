import { DemoButtons } from "@/components/DemoButtons";

export default function Home() {
  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Error Ingestor Demo
        </h1>
        <p className="text-gray-600">
          Test different error scenarios and view them in the dashboard.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <DemoButtons />
      </div>

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>
          Open the{" "}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Error Ingestor Dashboard
          </a>{" "}
          to view captured errors.
        </p>
      </div>
    </main>
  );
}
