import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreSettingsProvider>
          <CatalogProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CatalogProvider>
        </StoreSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
