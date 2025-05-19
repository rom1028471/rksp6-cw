import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateOnlineStatus } from '../store/slices/deviceSlice';

/**
 * Компонент для отслеживания онлайн-статуса и обновления Redux store
 */
const OnlineStatusProvider = ({ children }) => {
  const dispatch = useDispatch();

  // При монтировании компонента добавляем обработчики событий
  useEffect(() => {
    const handleOnline = () => {
      console.log('Соединение восстановлено');
      dispatch(updateOnlineStatus(true));
    };

    const handleOffline = () => {
      console.log('Соединение потеряно');
      dispatch(updateOnlineStatus(false));
    };

    // Добавляем обработчики событий
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Установка начального состояния
    dispatch(updateOnlineStatus(navigator.onLine));

    // Удаляем обработчики при размонтировании компонента
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default OnlineStatusProvider; 