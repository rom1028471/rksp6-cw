import apiClient from './apiClient';
import { store } from '../store';

let isUnloading = false;
let currentUserId = null; // Для отслеживания смены пользователя

const playbackSyncService = {
  /**
   * Инициализирует сервис синхронизации воспроизведения, добавляя обработчик события unload
   */
  init: () => {
    const handleUnload = () => {
      isUnloading = true;
      console.log('Обработка события beforeunload - сохраняем финальную позицию...');
      
      // Принудительно сохраняем позицию при выходе со страницы
      const state = store.getState();
      const { user } = state.auth;
      const { deviceId } = state.device;
      const { currentTrack, currentTime, isPlaying } = state.player;
      
      // Только если есть пользователь и трек - сохраняем позицию
      if (user && deviceId && currentTrack && currentTrack.id) {
        try {
          const payload = {
            deviceId,
            trackId: currentTrack.id,
            position: Math.floor(currentTime),
            isPlaying: false // При выходе всегда останавливаем воспроизведение
          };
          
          console.log('Сохраняем позицию при выходе:', payload);
          
          // Используем sendBeacon для надежной отправки данных при закрытии страницы
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon(`${apiClient.defaults.baseURL}/playback/position`, blob);
          
          console.log('Позиция успешно сохранена при выходе');
        } catch (err) {
          console.error('Ошибка при сохранении позиции при выходе:', err);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    console.log('Playback sync service initialized');
    
    // Возвращаем функцию очистки
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      console.log('Playback sync service cleaned up');
    };
  },

  /**
   * Запрашивает с сервера последнюю сохраненную позицию воспроизведения
   * @returns {Promise} Промис с данными о последней позиции воспроизведения
   */
  getLastPosition: async () => {
    const state = store.getState();
    const { user } = state.auth;
    const { deviceId } = state.device;
    
    if (!user || !deviceId) {
      console.log('Невозможно получить последнюю позицию: нет пользователя или ID устройства');
      return Promise.reject(new Error('Нет данных о пользователе или устройстве'));
    }

    // Проверка смены пользователя
    if (currentUserId !== null && currentUserId !== user.id) {
      console.log(`Обнаружена смена пользователя: ${currentUserId} -> ${user.id}`);
    }
    currentUserId = user.id;
    
    try {
      console.log(`Запрашиваем последнюю позицию для пользователя ${user.id} на устройстве ${deviceId}`);
      // Не передаем userId в параметрах - сервер возьмет ID из токена
      const response = await apiClient.get('/playback/position', { 
        params: { deviceId } 
      });
      console.log('Получена последняя позиция:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении последней позиции:', error);
      throw error;
    }
  },

  /**
   * Сохраняет текущую позицию воспроизведения на сервере
   * @param {boolean} [isUnloadingPage=false] - Указывает, вызвана ли функция во время выгрузки страницы
   * @returns {Promise|undefined} Промис с результатом сохранения или undefined при выгрузке страницы
   */
  saveFinalPosition: (isUnloadingPage = false) => {
    const state = store.getState();
    const { user } = state.auth;
    const { deviceId } = state.device;
    const { currentTrack, currentTime, isPlaying } = state.player;

    // Проверяем наличие необходимых данных
    if (!user || !deviceId || !currentTrack || !currentTrack.id) {
      console.log('Невозможно сохранить позицию: не хватает данных', { 
        hasUser: !!user,
        hasDeviceId: !!deviceId,
        hasTrack: !!currentTrack
      });
      return Promise.resolve();
    }
    
    // Убеждаемся, что сохраняем позицию для текущего залогиненного пользователя
    if (currentUserId !== user.id) {
      console.log(`Обнаружено несоответствие userID: ${currentUserId} vs ${user.id}, обновляем`);
      currentUserId = user.id;
    }
    
    const payload = {
      // userId: user.id - не передаем, сервер возьмет из токена
      deviceId,
      trackId: currentTrack.id,
      position: Math.floor(currentTime),
      isPlaying: isUnloadingPage ? false : isPlaying, // При выгрузке страницы всегда останавливаем воспроизведение
    };
    
    console.log('Сохраняем позицию воспроизведения:', payload);
    
    if (isUnloadingPage) {
      try {
        // Для события beforeunload используем sendBeacon для надежной отправки
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${apiClient.defaults.baseURL}/playback/position`, blob);
        console.log('Использован sendBeacon для сохранения позиции при выходе');
        return Promise.resolve();
      } catch (error) {
        console.error('Ошибка при использовании sendBeacon:', error);
      }
    }
    
    // Стандартный случай - используем обычный запрос
    return apiClient.post('/playback/position', payload)
      .then(response => {
        console.log('Позиция воспроизведения успешно сохранена:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('Ошибка при сохранении позиции воспроизведения:', error);
        throw error;
      });
  },
  
  /**
   * Периодически сохранять текущую позицию воспроизведения
   * @param {number} intervalMs - Интервал сохранения в миллисекундах
   * @returns {Function} Функция для остановки периодического сохранения
   */
  startPeriodicSave: (intervalMs = 30000) => {
    console.log(`Начинаем периодическое сохранение позиции каждые ${intervalMs}мс`);
    const intervalId = setInterval(() => {
      playbackSyncService.saveFinalPosition(false)
        .catch(err => console.error('Ошибка при периодическом сохранении:', err));
    }, intervalMs);
    
    return () => {
      console.log('Периодическое сохранение остановлено');
      clearInterval(intervalId);
    };
  },

  /**
   * Сбрасывает внутреннее состояние сервиса при выходе из системы
   */
  reset: () => {
    console.log('Сброс состояния playbackSync сервиса');
    currentUserId = null;
    
    // Очищаем sessionStorage чтобы избежать проблем с кешированием между пользователями
    sessionStorage.removeItem('current-playback-user');
    
    // Только если пользователь был залогинен, пытаемся сделать запрос
    const state = store.getState();
    const { user } = state.auth;
    
    if (user && typeof window !== 'undefined' && window.navigator) {
      try {
        // Отправляем запрос на сброс playback, но игнорируем его результат
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${apiClient.defaults.baseURL}/playback/reset`);
          console.log('Отправлен запрос сброса через sendBeacon');
        } else {
          // Альтернативный способ, если sendBeacon не поддерживается
          try {
            apiClient.post('/playback/reset')
              .then(() => console.log('Состояние сброшено через API'))
              .catch(err => console.error('Ошибка при сбросе состояния через API:', err));
          } catch (apiError) {
            console.error('Невозможно отправить запрос сброса:', apiError);
          }
        }
      } catch (err) {
        console.warn('Ошибка при сбросе состояния playbackSync:', err);
      }
    }
  }
};

export default playbackSyncService; 