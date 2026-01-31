import "reflect-metadata";

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import "./global.css";
import App from "./app";
import { FetchComponent } from "./utils/use.fetch";
import { Toaster } from "@growchief/frontend/utils/use.toaster.tsx";
import { Tooltip } from 'react-tooltip';
import { ErrorBoundary } from "@growchief/frontend/components/error.boundary.tsx";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Tooltip className="z-[99999]" id="tooltip" />
      <FetchComponent />
      <Toaster />
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
);
