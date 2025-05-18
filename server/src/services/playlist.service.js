const playlistRepository = require('../repositories/playlist.repository');
const trackRepository = require('../repositories/track.repository');
const fs = require('fs');
const path = require('path');

class PlaylistService {
  /**
   * Создает новый плейлист
   * @param {Object} playlistData - Данные плейлиста
   * @param {Object} coverFile - Загруженное изображение обложки (опционально)
   * @returns {Promise<Object>} - Созданный плейлист
   */
  async createPlaylist(playlistData, coverFile = null) {
    try {
      // Создаем данные для плейлиста
      const newPlaylistData = {
        ...playlistData,
        coverPath: coverFile ? `/uploads/images/${path.basename(coverFile.path)}` : null,
      };
      
      // Создаем плейлист в базе данных
      const playlist = await playlistRepository.create(newPlaylistData);
      
      // Получаем созданный плейлист
      const createdPlaylist = await playlistRepository.findById(playlist.id);
      
      return createdPlaylist;
    } catch (error) {
      // В случае ошибки удаляем загруженный файл обложки
      if (coverFile && fs.existsSync(coverFile.path)) {
        fs.unlinkSync(coverFile.path);
      }
      
      throw error;
    }
  }

  /**
   * Получает плейлист по ID
   * @param {string} id - ID плейлиста
   * @returns {Promise<Object>} - Данные плейлиста
   */
  async getPlaylistById(id) {
    const playlist = await playlistRepository.findById(id);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    return playlist;
  }

  /**
   * Обновляет данные плейлиста
   * @param {string} id - ID плейлиста
   * @param {Object} playlistData - Новые данные плейлиста
   * @returns {Promise<Object>} - Обновленный плейлист
   */
  async updatePlaylist(id, playlistData) {
    // Проверяем, существует ли плейлист
    const playlist = await playlistRepository.findById(id);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    // Обновляем данные плейлиста
    await playlistRepository.update(id, playlistData);
    
    // Получаем обновленный плейлист
    const updatedPlaylist = await playlistRepository.findById(id);
    
    return updatedPlaylist;
  }

  /**
   * Обновляет обложку плейлиста
   * @param {string} id - ID плейлиста
   * @param {Object} coverFile - Загруженное изображение обложки
   * @returns {Promise<Object>} - Обновленный плейлист
   */
  async updateCover(id, coverFile) {
    // Проверяем, существует ли плейлист
    const playlist = await playlistRepository.findById(id);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    // Если у плейлиста уже есть обложка, удаляем ее
    if (playlist.coverPath) {
      const oldCoverPath = path.join(__dirname, '../..', playlist.coverPath);
      
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
    }
    
    // Обновляем обложку плейлиста
    const coverPath = `/uploads/images/${path.basename(coverFile.path)}`;
    await playlistRepository.update(id, { coverPath });
    
    // Получаем обновленный плейлист
    const updatedPlaylist = await playlistRepository.findById(id);
    
    return updatedPlaylist;
  }

  /**
   * Удаляет плейлист
   * @param {string} id - ID плейлиста
   * @returns {Promise<boolean>} - Результат операции
   */
  async deletePlaylist(id) {
    // Проверяем, существует ли плейлист
    const playlist = await playlistRepository.findById(id);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    // Удаляем файл обложки, если он есть
    if (playlist.coverPath) {
      const coverPath = path.join(__dirname, '../..', playlist.coverPath);
      
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }
    
    // Удаляем плейлист из базы данных
    await playlistRepository.delete(id);
    
    return true;
  }

  /**
   * Получает список плейлистов
   * @param {Object} options - Опции запроса (пагинация, фильтры и т.д.)
   * @returns {Promise<Object>} - Список плейлистов с пагинацией
   */
  async getPlaylists(options = {}) {
    return await playlistRepository.findAll(options);
  }

  /**
   * Добавляет трек в плейлист
   * @param {string} playlistId - ID плейлиста
   * @param {string} trackId - ID трека
   * @param {number} position - Позиция трека в плейлисте (опционально)
   * @returns {Promise<Object>} - Обновленный плейлист
   */
  async addTrackToPlaylist(playlistId, trackId, position = 0) {
    // Проверяем, существует ли плейлист
    const playlist = await playlistRepository.findById(playlistId);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    // Проверяем, существует ли трек
    const track = await trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Добавляем трек в плейлист
    await playlistRepository.addTrack(playlistId, trackId, position);
    
    // Получаем обновленный плейлист
    const updatedPlaylist = await playlistRepository.findById(playlistId);
    
    return updatedPlaylist;
  }

  /**
   * Удаляет трек из плейлиста
   * @param {string} playlistId - ID плейлиста
   * @param {string} trackId - ID трека
   * @returns {Promise<Object>} - Обновленный плейлист
   */
  async removeTrackFromPlaylist(playlistId, trackId) {
    // Проверяем, существует ли плейлист
    const playlist = await playlistRepository.findById(playlistId);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    // Удаляем трек из плейлиста
    await playlistRepository.removeTrack(playlistId, trackId);
    
    // Получаем обновленный плейлист
    const updatedPlaylist = await playlistRepository.findById(playlistId);
    
    return updatedPlaylist;
  }

  /**
   * Изменяет порядок треков в плейлисте
   * @param {string} playlistId - ID плейлиста
   * @param {Array} trackOrder - Массив объектов { trackId, position }
   * @returns {Promise<Object>} - Обновленный плейлист
   */
  async reorderTracks(playlistId, trackOrder) {
    // Проверяем, существует ли плейлист
    const playlist = await playlistRepository.findById(playlistId);
    
    if (!playlist) {
      throw new Error('Плейлист не найден');
    }
    
    // Изменяем порядок треков
    await playlistRepository.reorderTracks(playlistId, trackOrder);
    
    // Получаем обновленный плейлист
    const updatedPlaylist = await playlistRepository.findById(playlistId);
    
    return updatedPlaylist;
  }
}

module.exports = new PlaylistService(); 