import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgBase: '#0a0a0a',
          colorBgContainer: '#161616',
          colorBgElevated: '#1a1a1a',
          colorBgLayout: '#0a0a0a',
          colorText: '#ffffff',
          colorTextSecondary: '#a1a1aa',
          colorBorder: '#27272a',
          colorBorderSecondary: '#3f3f46',
          borderRadius: 12,
          fontSize: 14,
        },
        components: {
          Layout: {
            bodyBg: '#0a0a0a',
            headerBg: '#161616',
            footerBg: '#161616',
          },
          Card: {
            actionsBg: '#1a1a1a',
          },
          Button: {
            primaryShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #27272a',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>
);
