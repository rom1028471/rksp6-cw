import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentTrack, setCurrentTime, setIsPlaying } from '../store/slices/playerSlice';
import apiClient from '../services/apiClient';

/**
 * Компонент для синхронизации воспроизведения между устройствами
 */
const SyncManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { deviceId, isOnline } = useSelector((state) => state.device);
  const { currentTrack, isPlaying, currentTime } = useSelector((state) => state.player);
  const [syncInterval, setSyncInterval] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const isFetchingRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  
  // Функция для получения позиции воспроизведения с сервера
  const fetchPlaybackPosition = useCallback(async () => {
    if (!user || !deviceId || !isOnline || !syncEnabled) return;
    
    // Предотвращаем одновременные запросы
    if (isFetchingRef.current) {
      console.log('Запрос к /playback/position уже выполняется, пропускаем');
      return;
    }
    
    // Проверяем, не слишком ли часто делаем запросы
    const now = Date.now();
    if (now - lastSyncTime < 10000) { // Минимальный интервал 10 секунд между запросами
      console.log('Слишком частый запрос позиции воспроизведения, пропускаем');
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLastSyncTime(now);
      
      const response = await apiClient.get(`/playback/position`, {
        params: {
          userId: user.id,
          deviceId: deviceId
        }
      });
      
      // Сброс счетчика ошибок при успешном запросе
      if (errorCount > 0) {
        setErrorCount(0);
      }
      
      const { track, position, isPlaying: remoteIsPlaying } = response.data;
      
      // Если на другом устройстве играет трек, и на этом ничего не играет или играет этот же трек
      if (track && (!currentTrack || (currentTrack && currentTrack.id === track.id))) {
        // Если это тот же трек, сравниваем позиции
        const positionDiff = Math.abs(position - currentTime);
        
        // Если разница в позиции больше 5 секунд или статус воспроизведения отличается
        if (!currentTrack || positionDiff > 5 || isPlaying !== remoteIsPlaying) {
          console.log('Синхронизация воспроизведения с другими устройствами');
          
          if (!currentTrack) {
            dispatch(setCurrentTrack(track));
          }
          
          dispatch(setCurrentTime(position));
          dispatch(setIsPlaying(remoteIsPlaying));
        }
      }
      
      isFetchingRef.current = false;
    } catch (error) {
      console.error('Ошибка при получении позиции воспроизведения:', error);
      
      // Увеличиваем счетчик ошибок
      const newErrorCount = errorCount + 1;
      setErrorCount(newErrorCount);
      
      // Если накопилось больше 3 ошибок подряд, отключаем синхронизацию
      if (newErrorCount > 3) {
        console.warn('Слишком много ошибок, синхронизация временно отключена');
        setSyncEnabled(false);
        
        // Пробуем включить синхронизацию через 5 минут
        setTimeout(() => {
          setSyncEnabled(true);
          setErrorCount(0);
        }, 300000); // 5 минут
      }
      
      isFetchingRef.current = false;
    }
  }, [user, deviceId, isOnline, syncEnabled, lastSyncTime, errorCount, currentTrack, currentTime, isPlaying, dispatch]);
  
  // Отправка позиции воспроизведения на сервер
  const sendPlaybackPosition = useCallback(async () => {
    if (!user || !deviceId || !currentTrack || !isOnline || !syncEnabled) return;
    
    try {
      await apiClient.post('/playback/position', {
        userId: user.id,
        deviceId: deviceId,
        trackId: currentTrack.id,
        position: currentTime,
        isPlaying: isPlaying
      });
    } catch (error) {
      console.error('Ошибка при отправке позиции воспроизведения:', error);
    }
  }, [user, deviceId, currentTrack, isOnline, syncEnabled, currentTime, isPlaying]);
  
  // Инициализация синхронизации при загрузке компонента
  useEffect(() => {
    // Получаем позицию воспроизведения с сервера при загрузке
    if (user && deviceId && isOnline && syncEnabled) {
      // При инициализации делаем одиночный запрос с задержкой, чтобы избежать множества запросов при загрузке страницы
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        fetchPlaybackPosition();
        
        // Устанавливаем интервал для периодической синхронизации
        const interval = setInterval(() => {
          if (isOnline && syncEnabled) {
            fetchPlaybackPosition();
          }
        }, 60000); // Каждую минуту (увеличен интервал с 30 до 60 секунд)
        
        setSyncInterval(interval);
      }, 5000); // Задержка 5 секунд перед первым запросом
    }
    
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, deviceId, isOnline, syncEnabled, fetchPlaybackPosition, syncInterval]);

  // При изменении онлайн-статуса
  useEffect(() => {
    if (isOnline && user && deviceId && Date.now() - lastSyncTime > 120000 && syncEnabled) {
      // Если восстановлено соединение и прошло больше 2 минут с последней синхронизации
      fetchPlaybackPosition();
    }
  }, [isOnline, user, deviceId, lastSyncTime, syncEnabled, fetchPlaybackPosition]);
  
  // Отправляем текущую позицию при изменении статуса воспроизведения
  useEffect(() => {
    if (user && deviceId && currentTrack && isOnline && syncEnabled) {
      sendPlaybackPosition();
    }
  }, [isPlaying, user, deviceId, currentTrack, isOnline, syncEnabled, sendPlaybackPosition]);

  // Отправляем текущую позицию при изменении трека
  useEffect(() => {
    if (user && deviceId && currentTrack && isOnline && syncEnabled) {
      sendPlaybackPosition();
    }
  }, [currentTrack, user, deviceId, isOnline, syncEnabled, sendPlaybackPosition]);

  // Компонент ничего не рендерит, он только синхронизирует данные
  return null;
};

export default SyncManager; 