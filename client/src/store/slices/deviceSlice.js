import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Функция для получения информации об устройстве
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Unknown';
  let deviceName = 'Unknown Device';

  // Определение типа устройства
  if (/Android/i.test(userAgent)) {
    deviceType = 'Android';
    deviceName = 'Android Device';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    deviceType = 'iOS';
    deviceName = userAgent.match(/iPhone|iPad|iPod/i)[0];
  } else if (/Windows/i.test(userAgent)) {
    deviceType = 'Windows';
    deviceName = 'Windows PC';
  } else if (/Macintosh/i.test(userAgent)) {
    deviceType = 'Mac';
    deviceName = 'Mac';
  } else if (/Linux/i.test(userAgent)) {
    deviceType = 'Linux';
    deviceName = 'Linux PC';
  }

  // Добавление информации о браузере
  if (/Chrome/i.test(userAgent)) {
    deviceName += ' - Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    deviceName += ' - Firefox';
  } else if (/Safari/i.test(userAgent)) {
    deviceName += ' - Safari';
  } else if (/MSIE|Trident/i.test(userAgent)) {
    deviceName += ' - IE';
  } else if (/Edge/i.test(userAgent)) {
    deviceName += ' - Edge';
  }

  return {
    deviceType,
    deviceName
  };
};

// Генерация ID устройства или получение из localStorage
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Начальное состояние
const initialState = {
  deviceId: getDeviceId(),
  ...getDeviceInfo(),
  isOnline: navigator.onLine,
};

// Создание слайса
const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    // Обновление статуса подключения
    updateOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    // Обновление имени устройства
    updateDeviceName: (state, action) => {
      state.deviceName = action.payload;
      // Обновляем имя в localStorage
      localStorage.setItem('deviceName', action.payload);
    },
    
    // Генерация нового ID устройства
    regenerateDeviceId: (state) => {
      const newDeviceId = uuidv4();
      state.deviceId = newDeviceId;
      localStorage.setItem('deviceId', newDeviceId);
    },
  },
});

export const { 
  updateOnlineStatus,
  updateDeviceName,
  regenerateDeviceId
} = deviceSlice.actions;

export default deviceSlice.reducer; 