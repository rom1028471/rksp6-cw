import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import trackService from '../../services/trackService';

// Асинхронные действия
export const fetchTracks = createAsyncThunk(
  'tracks/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await trackService.getTracks(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения треков');
    }
  }
);

export const fetchTrackById = createAsyncThunk(
  'tracks/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      return await trackService.getTrackById(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения трека');
    }
  }
);

export const uploadTrack = createAsyncThunk(
  'tracks/upload',
  async ({ formData, onProgress }, { rejectWithValue }) => {
    try {
      const trackService = (await import('../../services/trackService')).default;
      return await trackService.uploadTrack(formData, onProgress);
    } catch (error) {
      console.error('Ошибка в createAsyncThunk:', error);
      
      // Подробный вывод ошибки для отладки
      if (error.response) {
        // Ответ сервера с ошибкой
        console.error('Данные ответа:', error.response.data);
        console.error('Статус:', error.response.status);
        console.error('Заголовки:', error.response.headers);
        return rejectWithValue(error.response.data.message || 'Ошибка загрузки трека');
      } else if (error.request) {
        // Запрос был сделан, но ответа нет
        console.error('Запрос без ответа:', error.request);
        return rejectWithValue('Нет ответа от сервера');
      } else {
        // Произошла ошибка при настройке запроса
        console.error('Ошибка настройки:', error.message);
        return rejectWithValue(error.message || 'Ошибка загрузки трека');
      }
    }
  }
);

export const updateTrack = createAsyncThunk(
  'tracks/update',
  async ({ id, trackData }, { rejectWithValue }) => {
    try {
      return await trackService.updateTrack(id, trackData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления трека');
    }
  }
);

export const deleteTrack = createAsyncThunk(
  'tracks/delete',
  async (id, { rejectWithValue }) => {
    try {
      console.log(`[Redux] Запрос на удаление трека с ID: ${id}`);
      await trackService.deleteTrack(id);
      console.log(`[Redux] Трек с ID: ${id} успешно удален`);
      return id;
    } catch (error) {
      console.error('[Redux] Ошибка при удалении трека:', error.response?.data || error);
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления трека');
    }
  }
);

export const fetchGenres = createAsyncThunk(
  'tracks/fetchGenres',
  async (_, { rejectWithValue }) => {
    try {
      return await trackService.getGenres();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения жанров');
    }
  }
);

// Начальное состояние
const initialState = {
  tracks: [],
  currentTrack: null,
  genres: [],
  loading: false,
  uploading: false,
  error: null,
  uploadProgress: 0,
  page: 1,
  hasMore: true,
  pagination: {
    totalItems: 0,
    totalPages: 0,
  },
};

// Создание слайса
const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    clearTrackError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetTracks: (state) => {
      state.tracks = [];
      state.page = 1;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка получения списка треков
      .addCase(fetchTracks.pending, (state, action) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.loading = false;
        const { tracks, currentPage, totalPages, totalCount } = action.payload;

        if (currentPage === 1) {
          state.tracks = tracks;
        } else {
          const newTracks = tracks.filter(
            (newTrack) => !state.tracks.some((existingTrack) => existingTrack.id === newTrack.id)
          );
          state.tracks.push(...newTracks);
        }
        
        state.page = currentPage;
        state.hasMore = currentPage < totalPages;
        state.pagination = {
          totalItems: totalCount,
          currentPage: currentPage,
          totalPages: totalPages,
        };
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hasMore = false;
      })
      
      // Обработка получения трека по ID
      .addCase(fetchTrackById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrackById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrack = action.payload;
      })
      .addCase(fetchTrackById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка загрузки трека
      .addCase(uploadTrack.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadTrack.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.tracks.unshift(action.payload);
      })
      .addCase(uploadTrack.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      
      // Обработка обновления трека
      .addCase(updateTrack.fulfilled, (state, action) => {
        const index = state.tracks.findIndex(track => track.id === action.payload.id);
        if (index !== -1) {
          state.tracks[index] = action.payload;
        }
        if (state.currentTrack && state.currentTrack.id === action.payload.id) {
          state.currentTrack = action.payload;
        }
      })
      
      // Обработка удаления трека
      .addCase(deleteTrack.fulfilled, (state, action) => {
        state.tracks = state.tracks.filter(track => track.id !== action.payload);
        if (state.currentTrack && state.currentTrack.id === action.payload) {
          state.currentTrack = null;
        }
      })
      
      // Обработка получения списка жанров
      .addCase(fetchGenres.fulfilled, (state, action) => {
        state.genres = action.payload;
      });
  },
});

export const { clearTrackError, setUploadProgress, resetTracks } = tracksSlice.actions;

export default tracksSlice.reducer; 