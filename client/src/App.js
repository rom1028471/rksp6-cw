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
          const { user } = action.payload;
          const { deviceId } = action.payload;
          
          console.log('Пользователь авторизован:', user);
          console.log('ID устройства:', deviceId);
          
          if (user && user.id && deviceId) {
            // Создадим ключ сессии, чтобы отслеживать изменения пользователя
            const sessionKey = `last-user-${user.id}`;
            const lastLoadedUserKey = sessionStorage.getItem('current-playback-user');
            
            // Если это новый пользователь или первая загрузка
            if (lastLoadedUserKey !== sessionKey) {
              console.log('Первый вход пользователя в этой сессии, загружаем последнюю позицию...');
              sessionStorage.setItem('current-playback-user', sessionKey);
              
              // Задержка для гарантии что все хорошо инициализировалось
              setTimeout(() => {
                playbackSyncService.getLastPosition()
                  .then((data) => {
                    console.log('Получены данные о последней позиции:', data);
                    if (data && data.track) {
                      console.log('Устанавливаем последний трек и позицию:', {
                        track: data.track.title,
                        position: data.position
                      });
                      
                      dispatch(setInitialTrack({
                        track: data.track,
                        position: data.position || 0
                      }));
                    } else {
                      console.log('Нет данных о последней позиции');
                    }
                  })
                  .catch((error) => {
                    console.error('Ошибка при загрузке последней позиции:', error);
                  });
              }, 2000); // Увеличиваем задержку до 2 секунд для гарантии
            } else {
              console.log('Уже загружали данные для этого пользователя в этой сессии');
            }
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