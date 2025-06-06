import { createSlice } from '@reduxjs/toolkit';

// Начальное состояние
const initialState = {
  currentTrack: null,         // Текущий трек
  isPlaying: false,           // Состояние воспроизведения
  currentTime: 0,             // Текущая позиция воспроизведения
  volume: 0.7,                // Громкость
  isShuffled: false,          // Режим перемешивания
  isLooped: false,            // Режим повтора
  queue: [],                  // Очередь воспроизведения (заменит плейлист)
  originalQueue: [],          // Для восстановления после перемешивания
  currentTrackId: null,        // ID текущего трека
  duration: 0,                // Длительность текущего трека
};

// Создание слайса
const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setInitialTrack: (state, action) => {
      const { track, position } = action.payload;
      state.queue = [track];
      state.currentTrack = track;
      state.currentTrackId = track.id;
      state.currentTime = position;
      state.isPlaying = false; // Важно: не начинаем играть автоматически
      state.duration = track.duration;
    },
    // Установка текущего трека и очереди
    setQueue: (state, action) => {
      const { track, tracks } = action.payload;
      state.queue = tracks;
      state.originalQueue = tracks; // Сохраняем оригинальный порядок
      state.currentTrack = track || tracks[0];
      state.currentTime = 0;
      state.isPlaying = true; // Начинаем воспроизведение немедленно
      state.isShuffled = false; // Сбрасываем shuffle при новой очереди
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
    
    // Переключение режима перемешивания
    toggleShuffle: (state) => {
      state.isShuffled = !state.isShuffled;
      const currentTrackIndex = state.queue.findIndex(t => t.id === state.currentTrack?.id);
        
      if (state.isShuffled) {
        // Перемешиваем очередь, сохраняя текущий трек на месте
        const shuffledQueue = [...state.originalQueue];
        const trackToKeep = shuffledQueue.splice(currentTrackIndex, 1)[0];
          
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }
        state.queue = [trackToKeep, ...shuffledQueue];

      } else {
        // Возвращаем оригинальный порядок, но с текущим треком в начале
        const originalIndex = state.originalQueue.findIndex(t => t.id === state.currentTrack?.id);
        const reorderedOriginal = [...state.originalQueue];
        if (originalIndex > -1) {
          const [currentItem] = reorderedOriginal.splice(originalIndex, 1);
          reorderedOriginal.unshift(currentItem);
        }
        state.queue = reorderedOriginal;
      }
    },
    
    // Переключение режима повтора
    toggleLoop: (state) => {
      state.isLooped = !state.isLooped;
    },
    
    // Воспроизведение следующего трека
    playNextTrack: (state) => {
      if (state.queue.length === 0) return;

      const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
      
      let nextIndex = currentIndex + 1;
      
      if (nextIndex >= state.queue.length) {
        if (state.isLooped) {
          nextIndex = 0; // Возвращаемся в начало, если включен loop
        } else {
          // Воспроизведение остановлено, если это конец очереди и нет loop
          state.isPlaying = false;
          return;
        }
      }
      
      state.currentTrack = state.queue[nextIndex];
          state.currentTime = 0;
          state.isPlaying = true;
    },
    
    // Воспроизведение предыдущего трека
    playPreviousTrack: (state) => {
      if (state.queue.length === 0) return;
      
      const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);
      
      let prevIndex = currentIndex - 1;
      
      if (prevIndex < 0) {
        if (state.isLooped) {
          prevIndex = state.queue.length - 1; // Переходим в конец, если включен loop
        } else {
          return; // Ничего не делаем, если это начало очереди и нет loop
        }
      }
      
      state.currentTrack = state.queue[prevIndex];
          state.currentTime = 0;
          state.isPlaying = true;
    },
    
    // Сброс плеера
    resetPlayer: () => initialState,

    setDuration: (state, action) => {
      state.duration = action.payload;
    },
  },
});

export const { 
  setInitialTrack,
  setQueue,
  setIsPlaying,
  setCurrentTime,
  setVolume,
  toggleShuffle,
  toggleLoop,
  playNextTrack,
  playPreviousTrack,
  resetPlayer,
  setDuration
} = playerSlice.actions;

export default playerSlice.reducer; 