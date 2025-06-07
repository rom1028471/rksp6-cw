import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';
import playbackSyncService from '../../services/playbackSync.service';
import { resetPlayer } from './playerSlice';
import { persistor } from '../index';

// Асинхронные действия (thunks)
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      // Обработка сетевой ошибки
      if (error.code === 'ERR_NETWORK') {
        return rejectWithValue({
          message: 'Ошибка соединения с сервером. Пожалуйста, проверьте подключение к интернету или убедитесь, что сервер запущен.',
          status: error.code
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || 'Ошибка регистрации',
        status: error.response?.status
      });
    }
  }
);

// Thunk для входа пользователя
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      // Сохраняем токен и устанавливаем его в заголовки
      localStorage.setItem('token', data.token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка входа');
    }
  }
);

// Thunk для проверки авторизации по токену
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.checkAuth();
      return data; // Ожидается, что сервер вернет данные пользователя
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || 'Сессия истекла');
    }
  }
);

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('token');
  // Убираем токен из заголовков будущих запросов
  delete apiClient.defaults.headers.common['Authorization'];
  dispatch(logout());
};

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;
      return await authService.updateProfile(user.id, userData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления профиля');
    }
  }
);

export const fetchUserDevices = createAsyncThunk(
  'auth/fetchUserDevices',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user, devices } = getState().auth;
      
      // Не делаем запрос, если пользователь не авторизован
      if (!user) return [];
      
      // Не делаем запрос, если устройства уже загружены
      if (devices && devices.length > 0) {
        console.log('Используем кешированные данные устройств пользователя');
        return devices;
      }
      
      // Добавляем проверку на lastDevicesRequestTime, чтобы не отправлять запросы слишком часто
      const { lastDevicesRequestTime } = getState().auth;
      const now = Date.now();
      
      if (lastDevicesRequestTime && (now - lastDevicesRequestTime < 60000)) {
        console.log('Слишком частый запрос устройств, используем существующие данные');
        return devices || [];
      }
      
      const result = await authService.getUserDevices(user.id);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения устройств');
    }
  }
);

// Начальное состояние
const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: false,
  devices: [],
  lastDevicesRequestTime: null,
  error: null,
  online: navigator.onLine,
};

// Создание слайса
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setOnlineStatus: (state, action) => {
      state.online = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка состояния регистрации
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || 'Произошла неизвестная ошибка';
      })
      
      // Обработка состояния входа
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка проверки токена
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Обработка обновления профиля
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      
      // Обработка получения устройств пользователя
      .addCase(fetchUserDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
        state.lastDevicesRequestTime = Date.now();
      })
      .addCase(fetchUserDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setCredentials, clearError, setOnlineStatus } = authSlice.actions;

// Выход из системы
export const performLogout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, getState }) => {
    try {
      // Получаем важные данные перед выходом из системы
      const state = getState();
      const { user } = state.auth;
      const { deviceId } = state.device;
      const { currentTrack, currentTime } = state.player;
      
      console.log('Выполняем выход из системы. Проверяем наличие активного трека:', 
        currentTrack ? `${currentTrack.title} (${currentTime}с)` : 'Нет');
      
      // Только если есть пользователь, устройство и трек - сохраняем позицию
      if (user && deviceId && currentTrack && currentTrack.id) {
        try {
          console.log('Сохраняем позицию перед выходом:', Math.floor(currentTime));
          // Сохраняем позицию через сервис
          await playbackSyncService.saveFinalPosition(true);
          console.log('Позиция сохранена через playbackSyncService');
          
          // Дополнительно отправляем через прямой запрос API
          try {
            const response = await apiClient.post('/playback/position', {
              deviceId,
              trackId: currentTrack.id,
              position: Math.floor(currentTime || 0),
              isPlaying: false
            });
            console.log('Позиция дополнительно сохранена через API:', response.data);
          } catch (apiError) {
            console.warn('Не удалось сохранить позицию через API:', apiError);
          }
        } catch (syncError) {
          console.error('Ошибка при сохранении позиции:', syncError);
        }
      }
      
      // Очищаем хранилище
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('current-playback-user');
      
      // Удаляем заголовок Authorization
      delete apiClient.defaults.headers.common['Authorization'];
      
      // Сбрасываем состояние playbackSync сервиса
      playbackSyncService.reset();
      
      // Сбрасываем плеер
      dispatch(resetPlayer());
      
      // Диспатчим экшен logout из authSlice
      dispatch(logout());
      
      // Очищаем персистентное хранилище
      await persistor.purge();

      console.log('Выход из системы выполнен успешно');
      return null;
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      return null;
    }
  }
);

export default authSlice.reducer; 