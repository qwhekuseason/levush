import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import { RewardsProvider } from './context/RewardsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RewardsProvider>
          <CatalogProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CatalogProvider>
        </RewardsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
