import React from "react";
import ReactDOM from "react-dom/client";
import { DockerMuiThemeProvider } from "@docker/docker-mui-theme";
import CssBaseline from "@mui/material/CssBaseline";
import { RunbookProvider } from "./context/RunbookContext";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <DockerMuiThemeProvider>
      <CssBaseline />
      <RunbookProvider>
        <App />
      </RunbookProvider>
    </DockerMuiThemeProvider>
  </React.StrictMode>,
);
