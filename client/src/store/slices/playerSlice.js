import { createSlice } from '@reduxjs/toolkit';

// Начальное состояние
const initialState = {
  currentTrack: null,         // Текущий трек
  isPlaying: false,           // Состояние воспроизведения
  currentTime: 0,             // Текущая позиция воспроизведения
  volume: 0.7,                // Громкость
  isShuffled: false,          // Режим перемешивания
  isLooped: false,            // Режим повтора
  currentPlaylist: null,      // Текущий плейлист
  playlistTracks: [],         // Треки текущего плейлиста
  queue: [],                  // Очередь воспроизведения
};

// Создание слайса
const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    // Установка текущего трека
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
      state.isPlaying = true;
      state.currentTime = 0;
    },
    
    // Установка состояния воспроизведения
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    
    // Установка текущей позиции воспроизведения
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    
    // Установка громкости
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    
    // Установка текущего плейлиста
    setCurrentPlaylist: (state, action) => {
      const { playlist, tracks } = action.payload;
      state.currentPlaylist = playlist;
      state.playlistTracks = tracks;
    },
    
    // Очистка плейлиста
    clearPlaylist: (state) => {
      state.currentPlaylist = null;
      state.playlistTracks = [];
    },
    
    // Переключение режима перемешивания
    toggleShuffle: (state) => {
      state.isShuffled = !state.isShuffled;
      
      // При включении перемешивания - перемешиваем треки
      if (state.isShuffled && state.playlistTracks.length > 0) {
        const currentTrackId = state.currentTrack?.id;
        const currentTrackIndex = state.playlistTracks.findIndex(track => track.id === currentTrackId);
        
        if (currentTrackIndex !== -1) {
          // Удаляем текущий трек из массива для перемешивания
          const trackToKeep = state.playlistTracks[currentTrackIndex];
          const tracksToShuffle = state.playlistTracks.filter((_, i) => i !== currentTrackIndex);
          
          // Перемешиваем оставшиеся треки
          for (let i = tracksToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracksToShuffle[i], tracksToShuffle[j]] = [tracksToShuffle[j], tracksToShuffle[i]];
          }
          
          // Вставляем текущий трек обратно в начало
          state.playlistTracks = [trackToKeep, ...tracksToShuffle];
        }
      }
    },
    
    // Переключение режима повтора
    toggleLoop: (state) => {
      state.isLooped = !state.isLooped;
    },
    
    // Добавление треков в очередь
    addToQueue: (state, action) => {
      state.queue.push(action.payload);
    },
    
    // Очистка очереди
    clearQueue: (state) => {
      state.queue = [];
    },
    
    // Воспроизведение следующего трека
    playNextTrack: (state) => {
      // Если очередь не пуста, берем первый трек из очереди
      if (state.queue.length > 0) {
        state.currentTrack = state.queue.shift();
        state.currentTime = 0;
        state.isPlaying = true;
        return;
      }
      
      // Если воспроизводится плейлист
      if (state.currentPlaylist && state.playlistTracks.length > 0) {
        const currentTrackId = state.currentTrack?.id;
        const currentIndex = state.playlistTracks.findIndex(track => track.id === currentTrackId);
        
        if (currentIndex !== -1 && currentIndex < state.playlistTracks.length - 1) {
          // Переходим к следующему треку в плейлисте
          state.currentTrack = state.playlistTracks[currentIndex + 1];
          state.currentTime = 0;
          state.isPlaying = true;
        } else if (state.isLooped && state.playlistTracks.length > 0) {
          // Если включен режим повтора, начинаем плейлист сначала
          state.currentTrack = state.playlistTracks[0];
          state.currentTime = 0;
          state.isPlaying = true;
        }
      }
    },
    
    // Воспроизведение предыдущего трека
    playPreviousTrack: (state) => {
      // Если воспроизводится плейлист
      if (state.currentPlaylist && state.playlistTracks.length > 0) {
        const currentTrackId = state.currentTrack?.id;
        const currentIndex = state.playlistTracks.findIndex(track => track.id === currentTrackId);
        
        if (currentIndex > 0) {
          // Переходим к предыдущему треку в плейлисте
          state.currentTrack = state.playlistTracks[currentIndex - 1];
          state.currentTime = 0;
          state.isPlaying = true;
        } else if (state.isLooped && state.playlistTracks.length > 0) {
          // Если включен режим повтора, переходим к последнему треку
          state.currentTrack = state.playlistTracks[state.playlistTracks.length - 1];
          state.currentTime = 0;
          state.isPlaying = true;
        }
      }
    },
    
    // Сброс плеера
    resetPlayer: () => initialState,
  },
});

export const { 
  setCurrentTrack,
  setIsPlaying,
  setCurrentTime,
  setVolume,
  setCurrentPlaylist,
  clearPlaylist,
  toggleShuffle,
  toggleLoop,
  addToQueue,
  clearQueue,
  playNextTrack,
  playPreviousTrack,
  resetPlayer
} = playerSlice.actions;

export default playerSlice.reducer; 