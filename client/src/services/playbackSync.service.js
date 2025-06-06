import apiClient from './apiClient';
import { store } from '../store';

let isUnloading = false;

const playbackSyncService = {
  /**
   * Saves the final playback position. Can be called on logout or page unload.
   * Uses sendBeacon for reliability on unload.
   */
  saveFinalPosition: () => {
    if (isUnloading) return;

    const state = store.getState();
    const { user } = state.auth;
    const { deviceId } = state.device;
    const { currentTrack, currentTime, isPlaying } = state.player;

    if (!user || !deviceId || !currentTrack || !currentTrack.id) {
      return;
    }
    
    const payload = {
      trackId: currentTrack.id,
      position: Math.floor(currentTime),
      isPlaying: isPlaying,
      deviceId,
    };

    if (isUnloading) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/playback/position', blob);
    } else {
      return apiClient.post('/api/playback/position', payload);
    }
  },

  /**
   * Initializes the service, setting up the unload listener.
   */
  init: () => {
    const handleUnload = () => {
      isUnloading = true;
      playbackSyncService.saveFinalPosition();
    };
    window.addEventListener('beforeunload', handleUnload);
    console.log('Playback sync service initialized for final position saving.');
    
    // Return cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      console.log('Playback sync service cleaned up.');
    };
  },

  /**
   * Запрашивает с сервера последнюю сохраненную позицию.
   */
  getLastPosition() {
    return apiClient.get('/playback/position');
  },

  /**
   * Сохраняет финальную позицию трека.
   * @param {boolean} isUnloading - True, если вызвано событием beforeunload.
   */
  saveFinalPosition(isUnloading = false) {
    const state = store.getState();
    if (!state.player.currentTrack) {
      return Promise.resolve();
    }
    const { currentTrack, currentTime } = state.player;

    const payload = {
      trackId: currentTrack.id,
      position: currentTime,
    };

    if (isUnloading) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/playback/position', blob);
      return Promise.resolve();
    } else {
      return apiClient.post('/api/playback/position', payload);
    }
  },
};

export default playbackSyncService; 