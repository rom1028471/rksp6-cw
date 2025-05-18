import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import playbackService from '../../services/playbackService';

// Асинхронные действия
export const updatePlaybackPosition = createAsyncThunk(
  'playback/updatePosition',
  async (playbackData, { rejectWithValue }) => {
    try {
      const result = await playbackService.updatePosition(playbackData);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления позиции');
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
  },
  extraReducers: (builder) => {
    builder
      // Обработка обновления позиции воспроизведения
      .addCase(updatePlaybackPosition.pending, (state) => {
        // Здесь можно не менять состояние, так как это фоновая операция
      })
      .addCase(updatePlaybackPosition.fulfilled, (state) => {
        // Операция выполнена успешно
      })
      .addCase(updatePlaybackPosition.rejected, (state, action) => {
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
      });
  },
});

export const { clearPlaybackError, resetSyncStatus } = playbackSlice.actions;

export default playbackSlice.reducer; 