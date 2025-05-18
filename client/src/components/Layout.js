import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Player from './Player';

/**
 * Основной макет приложения, включающий навигацию, плеер и контент
 */
const Layout = () => {
  const { currentTrack } = useSelector((state) => state.player);
  
  return (
    <div className="app">
      <Navbar />
      <main className="container" style={{ paddingBottom: currentTrack ? '80px' : '20px' }}>
        <Outlet />
      </main>
      {currentTrack && <Player />}
    </div>
  );
};

export default Layout; 