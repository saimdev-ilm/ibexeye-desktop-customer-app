// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root element
const rootElement = document.getElementById('root');

// Ensure the root element exists
if (rootElement) {
  // Create a root
  const root = ReactDOM.createRoot(rootElement);
  
  // Render the App component
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
