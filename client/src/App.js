import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';
import { initializeDevice, setOnlineStatus } from './store/slices/deviceSlice';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TracksPage from './pages/TracksPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailsPage from './pages/PlaylistDetailsPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  // Инициализация устройства и проверка авторизации
  useEffect(() => {
    // Инициализация устройства
    dispatch(initializeDevice());
    
    // Проверка токена авторизации
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(checkAuth());
    }
    
    // Обработчики для отслеживания онлайн-статуса
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);
  
  // Если проверка авторизации еще не завершена, показываем индикатор загрузки
  if (loading) {
    return <div className="app-loading">Загрузка...</div>;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tracks" element={<TracksPage />} />
        <Route path="playlists" element={<PlaylistsPage />} />
        <Route path="playlists/:id" element={<PlaylistDetailsPage />} />
        
        <Route path="upload" element={
          <PrivateRoute>
            <UploadPage />
          </PrivateRoute>
        } />
        
        <Route path="profile" element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } />
        
        <Route path="*" element={<HomePage />} />
      </Route>
      
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
      } />
    </Routes>
  );
}

export default App; 