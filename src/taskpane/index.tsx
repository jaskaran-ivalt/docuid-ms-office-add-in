import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../tailwind.css";
import "./taskpane.css";

/* global Office */

// Render app - works both in Office and standalone browser
const renderApp = () => {
  const container = document.getElementById("container");
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
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
  if (typeof window.Office !== 'undefined' && typeof window.Office.onReady === 'function') {
    // Set a timeout to fallback if Office.onReady doesn't fire
    const timeout = setTimeout(() => {
      console.log('Office.onReady timeout - rendering in browser mode');
      renderApp();
    }, 1000);
    
    window.Office.onReady((info: any) => {
      clearTimeout(timeout);
      if (info.host === window.Office.HostType.Word) {
        renderApp();
      } else {
        // Office context but not Word - still render
        console.log('Office context detected but not Word host');
        renderApp();
      }
    });
  } else {
    // No Office context - browser mode
    renderApp();
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryOfficeReady);
} else {
  tryOfficeReady();
}
