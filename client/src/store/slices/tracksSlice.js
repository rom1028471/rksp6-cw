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
  async (formData, { rejectWithValue }) => {
    try {
      return await trackService.uploadTrack(formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки трека');
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
      await trackService.deleteTrack(id);
      return id;
    } catch (error) {
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
  pagination: {
    totalItems: 0,
    currentPage: 1,
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
  },
  extraReducers: (builder) => {
    builder
      // Обработка получения списка треков
      .addCase(fetchTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTracks.fulfilled, (state, action) => {
        state.loading = false;
        state.tracks = action.payload.tracks;
        state.pagination = {
          totalItems: action.payload.totalCount,
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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

export const { clearTrackError, setUploadProgress } = tracksSlice.actions;

export default tracksSlice.reducer; 