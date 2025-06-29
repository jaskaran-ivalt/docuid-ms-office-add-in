import { createRoot } from "react-dom/client";
import App from "./App";
import "./taskpane.css";

/* global Office */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const container = document.getElementById("container");
    const root = createRoot(container!);
    root.render(<App />);
  }
});
