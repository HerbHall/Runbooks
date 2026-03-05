import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  attemptCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, attemptCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo);
  }

  componentDidUpdate(_prevProps: Props, prevState: State): void {
    if (prevState.hasError && !this.state.hasError) {
      this.setState({ attemptCount: 0 });
    }
  }

  handleReset = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      attemptCount: prev.attemptCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
            }}
          >
            <ErrorOutlineIcon
              sx={{ fontSize: 64, color: "error.main", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Box
              component="pre"
              sx={{
                textAlign: "left",
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 1.5,
                mt: 0,
                mb: 3,
                fontSize: "0.8rem",
                lineHeight: 1.5,
                maxHeight: 200,
                overflowY: "auto",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {this.state.error?.message ?? "An unexpected error occurred."}
            </Box>
            {this.state.attemptCount >= 3 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Unable to recover. Try clearing your data or refreshing the page.
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    Clear Data &amp; Reload
                  </Button>
                  <Button
                    variant="outlined"
                    href="https://github.com/HerbHall/Runbooks/issues/new?template=bug_report.yml"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Report Bug
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button variant="contained" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  href="https://github.com/HerbHall/Runbooks/issues/new?template=bug_report.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report Bug
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
