import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ErrorListPage } from "./pages/ErrorListPage";
import { TrendsPage } from "./pages/TrendsPage";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/errors" replace />} />
        <Route path="/errors" element={<ErrorListPage />} />
        <Route path="/trends" element={<TrendsPage />} />
      </Routes>
    </Layout>
  );
}
