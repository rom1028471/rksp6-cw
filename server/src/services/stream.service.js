const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config');
const trackRepository = require('../repositories/track.repository');
const playbackPositionRepository = require('../repositories/playbackPosition.repository');
const { v4: uuidv4 } = require('uuid');

class StreamService {
  /**
   * Конвертирует аудио файл в HLS формат
   * @param {string} trackId - ID трека
   * @param {string} filePath - Путь к оригинальному аудио файлу
   * @returns {Promise<string>} - Путь к HLS плейлисту
   */
  async createHlsStream(trackId, filePath) {
    const track = await trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    const streamDir = path.join(config.storage.streamDir, trackId.toString());
    const playlistPath = path.join(streamDir, 'playlist.m3u8');
    
    // Создаем директорию для стрима, если она не существует
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }
    
    // Если плейлист уже существует, возвращаем его
    if (fs.existsSync(playlistPath)) {
      return `/streams/${trackId}/playlist.m3u8`;
    }
    
    // Создаем уникальный HLS стрим с помощью ffmpeg
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          '-c:a aac',
          '-b:a 128k',
          '-f hls',
          `-hls_time ${config.hls.segmentDuration}`,
          `-hls_playlist_type vod`,
          `-hls_segment_filename ${path.join(streamDir, 'segment_%03d.ts')}`,
        ])
        .output(playlistPath)
        .on('end', () => {
          // Обновляем путь к стриму в базе данных
          const streamPath = `/streams/${trackId}/playlist.m3u8`;
          trackRepository.update(trackId, { stream_path: streamPath });
          resolve(streamPath);
        })
        .on('error', (err) => {
          console.error('Ошибка при создании HLS стрима:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Получает информацию о стриме
   * @param {string} trackId - ID трека
   * @returns {Promise<Object>} - Информация о стриме
   */
  async getStreamInfo(trackId) {
    const track = await trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Если у трека еще нет стрима, создаем его
    if (!track.stream_path) {
      const filePath = path.join(process.cwd(), track.file_path);
      const streamPath = await this.createHlsStream(trackId, filePath);
      return { 
        streamPath,
        duration: track.duration,
        title: track.title,
        artist: track.artist,
      };
    }
    
    return {
      streamPath: track.stream_path,
      duration: track.duration,
      title: track.title,
      artist: track.artist,
    };
  }

  /**
   * Получает текущую позицию воспроизведения
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object>} - Информация о позиции воспроизведения
   */
  async getPlaybackPosition(userId, trackId, deviceId) {
    const track = await trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Получаем позицию воспроизведения из репозитория
    const position = await playbackPositionRepository.findByUserTrackDevice(userId, trackId, deviceId);
    
    if (!position) {
      return {
        position: 0, // По умолчанию начинаем с начала
        isPlaying: false,
      };
    }
    
    return {
      position: position.position,
      isPlaying: position.is_playing,
    };
  }

  /**
   * Обновляет позицию воспроизведения
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @param {number} position - Позиция в секундах
   * @param {boolean} isPlaying - Статус воспроизведения
   * @returns {Promise<Object>} - Обновленная информация о позиции воспроизведения
   */
  async updatePlaybackPosition(userId, trackId, deviceId, position, isPlaying) {
    const track = await trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Обновляем позицию воспроизведения в репозитории
    const updatedPosition = await playbackPositionRepository.upsert(userId, trackId, deviceId, {
      position,
      is_playing: isPlaying,
    });
    
    return {
      trackId,
      position: updatedPosition.position,
      isPlaying: updatedPosition.is_playing,
      updatedAt: updatedPosition.updated_at,
    };
  }
}

module.exports = new StreamService(); 