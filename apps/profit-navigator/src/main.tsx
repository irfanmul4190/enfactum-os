import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@repo/ui/error-boundary";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary fallbackTitle="Profit Navigator crashed">
    <App />
  </ErrorBoundary>,
);
