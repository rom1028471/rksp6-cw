import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Импорт слайсов (reducers)
import authReducer from './slices/authSlice';
import playerReducer from './slices/playerSlice';
import tracksReducer from './slices/tracksSlice';
import playlistsReducer from './slices/playlistsSlice';
import playbackReducer from './slices/playbackSlice';
import deviceReducer from './slices/deviceSlice';

// Конфигурация для сохранения состояния в localStorage
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'player', 'device'] // Указываем, какие слайсы должны сохраняться в localStorage
};

// Объединяем все редьюсеры
const rootReducer = combineReducers({
  auth: authReducer,
  player: playerReducer,
  tracks: tracksReducer,
  playlists: playlistsReducer,
  playback: playbackReducer,
  device: deviceReducer,
});

// Создаем персистентный редьюсер
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Создаем store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

// Создаем персистор для сохранения состояния
const persistor = persistStore(store);

export { store, persistor }; 