import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { register as registerServiceWorker } from "./serviceWorkerRegistration.js";
import { startSyncManager } from "./offline/sync/syncManager.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: "always",
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      networkMode: "always",
    },
  },
});

registerServiceWorker();
startSyncManager();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryClientProvider>,
);
