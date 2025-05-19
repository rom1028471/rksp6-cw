import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Player from './Player';
import SyncManager from './SyncManager';

/**
 * Основной макет приложения, включающий навигацию, плеер и контент
 */
const Layout = () => {
  const { currentTrack } = useSelector((state) => state.player);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Не инициализируем SyncManager на страницах, где он может вызывать проблемы
  const shouldEnableSync = useMemo(() => {
    // Список путей, где не нужно включать SyncManager
    const excludedPaths = [
      '/profile',
      '/settings',
      '/admin'
    ];
    
    return isAuthenticated && !excludedPaths.some(path => location.pathname.startsWith(path));
  }, [isAuthenticated, location.pathname]);
  
  return (
    <div className="app">
      <Navbar />
      <main className="container" style={{ paddingBottom: currentTrack ? '80px' : '20px' }}>
        <Outlet />
      </main>
      {currentTrack && <Player />}
      {shouldEnableSync && <SyncManager />}
    </div>
  );
};

export default Layout; 