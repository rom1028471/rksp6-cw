import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import playlistService from '../../services/playlistService';

// Асинхронные действия
export const fetchPlaylists = createAsyncThunk(
  'playlists/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await playlistService.getPlaylists(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения плейлистов');
    }
  }
);

export const fetchPlaylistById = createAsyncThunk(
  'playlists/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      return await playlistService.getPlaylistById(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения плейлиста');
    }
  }
);

export const createPlaylist = createAsyncThunk(
  'playlists/create',
  async (formData, { rejectWithValue }) => {
    try {
      return await playlistService.createPlaylist(formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания плейлиста');
    }
  }
);

export const updatePlaylist = createAsyncThunk(
  'playlists/update',
  async ({ id, playlistData }, { rejectWithValue }) => {
    try {
      return await playlistService.updatePlaylist(id, playlistData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления плейлиста');
    }
  }
);

export const deletePlaylist = createAsyncThunk(
  'playlists/delete',
  async (id, { rejectWithValue }) => {
    try {
      await playlistService.deletePlaylist(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления плейлиста');
    }
  }
);

export const addTrackToPlaylist = createAsyncThunk(
  'playlists/addTrack',
  async ({ playlistId, trackId, position = 0 }, { rejectWithValue }) => {
    try {
      return await playlistService.addTrackToPlaylist(playlistId, { trackId, position });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка добавления трека в плейлист');
    }
  }
);

export const removeTrackFromPlaylist = createAsyncThunk(
  'playlists/removeTrack',
  async ({ playlistId, trackId }, { rejectWithValue }) => {
    try {
      return await playlistService.removeTrackFromPlaylist(playlistId, trackId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления трека из плейлиста');
    }
  }
);

export const reorderPlaylistTracks = createAsyncThunk(
  'playlists/reorderTracks',
  async ({ playlistId, trackOrder }, { rejectWithValue }) => {
    try {
      return await playlistService.reorderTracks(playlistId, { trackOrder });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка изменения порядка треков');
    }
  }
);

// Начальное состояние
const initialState = {
  playlists: [],
  currentPlaylist: null,
  loading: false,
  creating: false,
  error: null,
  pagination: {
    totalItems: 0,
    currentPage: 1,
    totalPages: 0,
  },
};

// Создание слайса
const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    clearPlaylistError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка получения списка плейлистов
      .addCase(fetchPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.playlists = action.payload.playlists;
        state.pagination = {
          totalItems: action.payload.totalCount,
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка получения плейлиста по ID
      .addCase(fetchPlaylistById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaylistById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlaylist = action.payload;
      })
      .addCase(fetchPlaylistById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка создания плейлиста
      .addCase(createPlaylist.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.creating = false;
        state.playlists.unshift(action.payload);
      })
      .addCase(createPlaylist.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Обработка обновления плейлиста
      .addCase(updatePlaylist.fulfilled, (state, action) => {
        const index = state.playlists.findIndex(playlist => playlist.id === action.payload.id);
        if (index !== -1) {
          state.playlists[index] = action.payload;
        }
        if (state.currentPlaylist && state.currentPlaylist.id === action.payload.id) {
          state.currentPlaylist = action.payload;
        }
      })
      
      // Обработка удаления плейлиста
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.playlists = state.playlists.filter(playlist => playlist.id !== action.payload);
        if (state.currentPlaylist && state.currentPlaylist.id === action.payload) {
          state.currentPlaylist = null;
        }
      })
      
      // Обработка добавления трека в плейлист
      .addCase(addTrackToPlaylist.fulfilled, (state, action) => {
        if (state.currentPlaylist && state.currentPlaylist.id === action.payload.id) {
          state.currentPlaylist = action.payload;
        }
      })
      
      // Обработка удаления трека из плейлиста
      .addCase(removeTrackFromPlaylist.fulfilled, (state, action) => {
        if (state.currentPlaylist && state.currentPlaylist.id === action.payload.id) {
          state.currentPlaylist = action.payload;
        }
      })
      
      // Обработка изменения порядка треков
      .addCase(reorderPlaylistTracks.fulfilled, (state, action) => {
        if (state.currentPlaylist && state.currentPlaylist.id === action.payload.id) {
          state.currentPlaylist = action.payload;
        }
      });
  },
});

export const { clearPlaylistError } = playlistsSlice.actions;

export default playlistsSlice.reducer; 