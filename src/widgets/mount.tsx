import React from "react";
import ReactDOM from "react-dom/client";
import AssistantWidget from "./widgets/AssistantWidget";
export function mountAssistantWidget() {
  const id = "assistant-widget-root";
  if (!document.getElementById(id)) {
    const div = document.createElement("div"); div.id = id; document.body.appendChild(div);
    ReactDOM.createRoot(div).render(<AssistantWidget />);
  }
}
if (document.readyState !== "loading") mountAssistantWidget();
else document.addEventListener("DOMContentLoaded", mountAssistantWidget);
