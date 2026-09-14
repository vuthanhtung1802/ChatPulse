import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app/AppProviders";
import { AppRouter } from "./app/router/AppRouter";
import { AppErrorBoundary } from "./app/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProviders>
    </AppErrorBoundary>
  );
}
