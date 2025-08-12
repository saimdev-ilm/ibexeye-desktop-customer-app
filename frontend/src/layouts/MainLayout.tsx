import React, { useState } from 'react';
import Login from '../pages/Login';
import MainContent from '../pages/MainContent'; 

const MainLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'main'>('login');  

  const handleLogin = () => {
    setCurrentPage('main');
  };

  const handleLogout = () => {
    setCurrentPage('login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'main':
        return <MainContent onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return renderPage();
};

export default MainLayout;
