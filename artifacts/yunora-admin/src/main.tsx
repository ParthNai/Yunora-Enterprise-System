import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import { getApiUrl } from "./lib/api";
import App from "./App";
import "./index.css";

// Configure base URL for API client hooks
const apiUrl = getApiUrl("");
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);

