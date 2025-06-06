import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setInitialTrack } from './playerSlice';
import playbackService from '../../services/playbackService';
import apiClient from '../../services/apiClient';

// Асинхронные действия
export const updatePlaybackPosition = createAsyncThunk(
  'playback/updatePosition',
  async (positionData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/playback/position', positionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка при обновлении позиции');
    }
  }
);

export const completePlayback = createAsyncThunk(
  'playback/complete',
  async (playbackData, { rejectWithValue }) => {
    try {
      const result = await playbackService.completePlayback(playbackData);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка завершения воспроизведения');
    }
  }
);

export const fetchPlaybackHistory = createAsyncThunk(
  'playback/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      const result = await playbackService.getUserHistory(params);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения истории');
    }
  }
);

export const getLastTrackPosition = createAsyncThunk(
  'playback/getLastPosition',
  async (trackId, { rejectWithValue }) => {
    try {
      const result = await playbackService.getLastTrackPosition(trackId);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения последней позиции');
    }
  }
);

export const syncPlayback = createAsyncThunk(
  'playback/sync',
  async (deviceData, { rejectWithValue }) => {
    try {
      const result = await playbackService.syncPlayback(deviceData);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка синхронизации');
    }
  }
);

export const getUserActiveDevices = createAsyncThunk(
  'playback/getDevices',
  async (_, { rejectWithValue }) => {
    try {
      const result = await playbackService.getUserActiveDevices();
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения списка устройств');
    }
  }
);

// Async thunk для получения позиции воспроизведения
export const fetchPlaybackPosition = createAsyncThunk(
  'playback/fetchPosition',
  async ({ userId, deviceId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/playback/position`, { params: { userId, deviceId } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка при получении позиции');
    }
  }
);

// Async thunk для получения позиций всех устройств
export const fetchAllDevicesPositions = createAsyncThunk(
  'playback/fetchAllDevices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/playback/devices');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка при получении данных устройств');
    }
  }
);

// Начальное состояние
const initialState = {
  history: [],
  lastPosition: null,
  activeDevices: [],
  loading: false,
  error: null,
  syncStatus: {
    syncing: false,
    success: false,
    error: null,
  },
  historyPagination: {
    totalItems: 0,
    currentPage: 1,
    totalPages: 0,
  },
  devicePositions: [],
  lastSyncTime: null,
  updateStatus: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
  fetchStatus: 'idle',
  syncEnabled: true
};

// Создание слайса
const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    clearPlaybackError: (state) => {
      state.error = null;
    },
    resetSyncStatus: (state) => {
      state.syncStatus = {
        syncing: false,
        success: false,
        error: null,
      };
    },
    toggleSync(state) {
      state.syncEnabled = !state.syncEnabled;
    },
    setLastSyncTime(state, action) {
      state.lastSyncTime = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка обновления позиции
      .addCase(updatePlaybackPosition.pending, (state) => {
        state.updateStatus = 'loading';
      })
      .addCase(updatePlaybackPosition.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(updatePlaybackPosition.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload;
      })
      
      // Обработка завершения воспроизведения
      .addCase(completePlayback.fulfilled, (state) => {
        // Операция выполнена успешно
      })
      
      // Обработка получения истории воспроизведения
      .addCase(fetchPlaybackHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlaybackHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.history;
        state.historyPagination = {
          totalItems: action.payload.totalCount,
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPlaybackHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка получения последней позиции трека
      .addCase(getLastTrackPosition.fulfilled, (state, action) => {
        state.lastPosition = action.payload;
      })
      
      // Обработка синхронизации воспроизведения
      .addCase(syncPlayback.pending, (state) => {
        state.syncStatus.syncing = true;
        state.syncStatus.error = null;
      })
      .addCase(syncPlayback.fulfilled, (state) => {
        state.syncStatus.syncing = false;
        state.syncStatus.success = true;
      })
      .addCase(syncPlayback.rejected, (state, action) => {
        state.syncStatus.syncing = false;
        state.syncStatus.success = false;
        state.syncStatus.error = action.payload;
      })
      
      // Обработка получения активных устройств
      .addCase(getUserActiveDevices.fulfilled, (state, action) => {
        state.activeDevices = action.payload;
      })
      
      // Обработка получения позиции
      .addCase(fetchPlaybackPosition.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchPlaybackPosition.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(fetchPlaybackPosition.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })
      
      // Обработка получения позиций всех устройств
      .addCase(fetchAllDevicesPositions.fulfilled, (state, action) => {
        state.devicePositions = action.payload;
      });
  },
});

export const { clearPlaybackError, resetSyncStatus, toggleSync, setLastSyncTime } = playbackSlice.actions;

export default playbackSlice.reducer; 