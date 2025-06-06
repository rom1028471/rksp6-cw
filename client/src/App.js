import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';
import { initializeDevice, setOnlineStatus } from './store/slices/deviceSlice';
import { fetchPlaybackPosition } from './store/slices/playbackSlice';
import { setInitialTrack } from './store/slices/playerSlice';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TracksPage from './pages/TracksPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import playbackSyncService from './services/playbackSync.service';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  
  // Инициализация сервисов и обработчиков
  useEffect(() => {
    dispatch(initializeDevice());

    const onlineHandler = () => dispatch(setOnlineStatus(true));
    const offlineHandler = () => dispatch(setOnlineStatus(false));
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    // Инициализация сервиса синхронизации и получение функции очистки
    const cleanupSyncService = playbackSyncService.init();

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      cleanupSyncService(); // Вызов функции очистки
    };
  }, [dispatch]);

  // Проверка авторизации и загрузка состояния плеера
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(checkAuth()).then((action) => {
        if (checkAuth.fulfilled.match(action) && action.payload) {
          const { id: userId, deviceId } = action.payload;
          if (userId && deviceId) {
            dispatch(fetchPlaybackPosition({ userId, deviceId }))
              .unwrap()
              .then((playbackState) => {
                if (playbackState && playbackState.track) {
                  dispatch(setInitialTrack({
                    track: playbackState.track,
                    position: playbackState.position,
                  }));
                }
              })
              .catch(err => console.error("Failed to fetch playback position:", err));
          }
        }
      });
    }
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