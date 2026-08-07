import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router/AppRouter';

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}