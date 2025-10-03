import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { store, persistor } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './components/ThemeProvider.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 1. Import
import ErrorBoundary from './components/ErrorBoundary.jsx';

// 2. Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <PersistGate persistor={persistor}>
            <Provider store={store}>
                {/* 3. Wrap your app in the provider */}
                <QueryClientProvider client={queryClient}>
                    <ErrorBoundary onReset={() => queryClient.clear()}>
                        <HelmetProvider>
                            <ThemeProvider>
                                <App />
                            </ThemeProvider>
                        </HelmetProvider>
                    </ErrorBoundary>
                </QueryClientProvider>
            </Provider>
        </PersistGate>
    </React.StrictMode>
);