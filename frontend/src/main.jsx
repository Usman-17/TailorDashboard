import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { register as registerServiceWorker } from "./serviceWorkerRegistration.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: "always", // Prevent query pausing when offline
      retry: (failureCount, error) => {
        // Do not retry 4xx errors or if offline
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      networkMode: "always",
    },
  },
});

// Register Service Worker for PWA Offline App Shell
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryClientProvider>,
);
