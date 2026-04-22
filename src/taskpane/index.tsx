import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { OfficeHostService, OfficeHost } from "@/taskpane/services/OfficeHostService";
import "../tailwind.css";
import "./taskpane.css";

/* global Office */

// Render app - works both in Office and standalone browser
const renderApp = (host: OfficeHost) => {
  const container = document.getElementById("container");
  if (container) {
    const root = createRoot(container);
    root.render(<App officeHost={host} />);
  }
};

// Check if running inside Office context
// Office.js sets window.Office when loaded
declare global {
  interface Window {
    Office?: any;
  }
}

// Try Office context first, fallback to browser mode
const tryOfficeReady = () => {
  if (typeof window.Office !== "undefined" && typeof window.Office.onReady === "function") {
    // Set a timeout to fallback if Office.onReady doesn't fire
    const timeout = setTimeout(() => {
      renderApp("Unknown");
    }, 1000);

    window.Office.onReady(() => {
      clearTimeout(timeout);
      // OfficeHostService reads Office.context.host after onReady fires
      const host = OfficeHostService.getHost();
      renderApp(host);
    });
  } else {
    // No Office context - browser mode
    renderApp("Unknown");
  }
};

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", tryOfficeReady);
} else {
  tryOfficeReady();
}
