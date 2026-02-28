import React from "react";
import ReactDOM from "react-dom/client";
import { DockerMuiThemeProvider } from "@docker/docker-mui-theme";
import CssBaseline from "@mui/material/CssBaseline";
import { RunbookProvider } from "./context/RunbookContext";
import { CategoryProvider } from "./context/CategoryContext";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <DockerMuiThemeProvider>
      <CssBaseline />
      <ErrorBoundary>
        <RunbookProvider>
          <CategoryProvider>
            <App />
          </CategoryProvider>
        </RunbookProvider>
      </ErrorBoundary>
    </DockerMuiThemeProvider>
  </React.StrictMode>,
);
