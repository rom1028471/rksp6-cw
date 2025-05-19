import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

/**
 * Определение типа устройства
 */
function detectDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Проверка на мобильное устройство
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }
  
  // Проверка на планшет (общий подход)
  if (/tablet|ipad|playbook|silk|android(?!.*mobile)/i.test(userAgent)) {
    return 'Tablet';
  }
  
  // Определение настольной ОС
  if (/Windows/.test(userAgent)) {
    return 'Windows Desktop';
  }
  
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
    return 'MacOS';
  }
  
  if (/Linux/.test(userAgent)) {
    return 'Linux';
  }
  
  return 'Unknown Device';
}

// Определение начального состояния
const initialState = {
  deviceId: localStorage.getItem('deviceId') || null,
  deviceName: localStorage.getItem('deviceName') || null,
  deviceType: localStorage.getItem('deviceType') || detectDeviceType(),
  isOnline: navigator.onLine,
  isMaster: localStorage.getItem('deviceIsMaster') === 'true' || false,
  lastSync: localStorage.getItem('lastDeviceSync') || null
};

// Создание слайса
const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    // Инициализация устройства при первом запуске приложения
    initializeDevice: (state, action) => {
      if (!state.deviceId) {
        state.deviceId = uuidv4();
        localStorage.setItem('deviceId', state.deviceId);
      }
      
      if (!state.deviceName || action.payload?.deviceName) {
        state.deviceName = action.payload?.deviceName || `${state.deviceType} ${state.deviceId.substring(0, 4)}`;
        localStorage.setItem('deviceName', state.deviceName);
      }
      
      if (!state.deviceType) {
        state.deviceType = detectDeviceType();
        localStorage.setItem('deviceType', state.deviceType);
      }
    },
    
    // Обновление сетевого статуса устройства
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    // Обновление имени устройства
    setDeviceName: (state, action) => {
      state.deviceName = action.payload;
      localStorage.setItem('deviceName', state.deviceName);
    },
    
    // Установка статуса мастер-устройства (главное устройство пользователя)
    setMasterDevice: (state, action) => {
      state.isMaster = action.payload;
      localStorage.setItem('deviceIsMaster', action.payload.toString());
    },
    
    // Обновление времени последней синхронизации
    updateLastSync: (state) => {
      const now = new Date().toISOString();
      state.lastSync = now;
      localStorage.setItem('lastDeviceSync', now);
    }
  }
});

// Экспорт действий и редьюсера
export const { 
  initializeDevice, 
  setOnlineStatus, 
  setDeviceName,
  setMasterDevice,
  updateLastSync
} = deviceSlice.actions;

export default deviceSlice.reducer; 