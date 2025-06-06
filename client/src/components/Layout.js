import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Player from './Player';

/**
 * Основной макет приложения, включающий навигацию, плеер и контент
 */
const Layout = () => {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <div className="app">
      <Navbar />
      <main className="container" style={{ paddingBottom: '80px' }}>
        <Outlet />
      </main>
      {/* Отображаем плеер всегда, для неавторизованных - с просьбой авторизоваться */}
      <Player />
    </div>
  );
};

export default Layout; 