import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

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

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      // Обработка сетевой ошибки
      if (error.code === 'ERR_NETWORK') {
        return rejectWithValue({
          message: 'Ошибка соединения с сервером. Пожалуйста, проверьте подключение к интернету или убедитесь, что сервер запущен.',
          status: error.code
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || 'Ошибка входа',
        status: error.response?.status
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { deviceId } = getState().device;
      await authService.logout({ deviceId });
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка выхода');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      if (!token) return null;
      
      return await authService.validateToken(token);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Токен недействителен');
    }
  }
);

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
  token: null,
  isAuthenticated: false,
  loading: false,
  devices: [],
  lastDevicesRequestTime: null,
  error: null,
};

// Создание слайса
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Очистка сообщений об ошибках
    clearError: (state) => {
      state.error = null;
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
        state.error = action.payload.message || 'Произошла неизвестная ошибка';
      })
      
      // Обработка состояния выхода
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      
      // Обработка проверки токена
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
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

export const { clearError } = authSlice.actions;

export default authSlice.reducer; 