import apiClient from './apiClient';

/**
 * Сервис для работы с плейлистами
 */
class PlaylistService {
  /**
   * Получает список плейлистов
   * @param {Object} params - Параметры запроса (page, limit, search, userId, isPublic)
   * @returns {Promise<Object>} - Список плейлистов с пагинацией
   */
  async getPlaylists(params = {}) {
    const response = await apiClient.get('/playlists', { params });
    return response.data;
  }

  /**
   * Получает плейлист по ID
   * @param {string} id - ID плейлиста
   * @returns {Promise<Object>} - Объект плейлиста
   */
  async getPlaylistById(id) {
    const response = await apiClient.get(`/playlists/${id}`);
    return response.data;
  }

  /**
   * Создает новый плейлист
   * @param {FormData} formData - Данные плейлиста и файл обложки
   * @returns {Promise<Object>} - Созданный объект плейлиста
   */
  async createPlaylist(formData) {
    const response = await apiClient.post('/playlists', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Обновляет информацию о плейлисте
   * @param {string} id - ID плейлиста
   * @param {Object} playlistData - Новые данные плейлиста
   * @returns {Promise<Object>} - Обновленный объект плейлиста
   */
  async updatePlaylist(id, playlistData) {
    const response = await apiClient.put(`/playlists/${id}`, playlistData);
    return response.data;
  }

  /**
   * Обновляет обложку плейлиста
   * @param {string} id - ID плейлиста
   * @param {File} file - Файл изображения
   * @returns {Promise<Object>} - Обновленный объект плейлиста
   */
  async updateCover(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.put(`/playlists/${id}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * Удаляет плейлист
   * @param {string} id - ID плейлиста
   * @returns {Promise<Object>} - Сообщение об успешном удалении
   */
  async deletePlaylist(id) {
    const response = await apiClient.delete(`/playlists/${id}`);
    return response.data;
  }

  /**
   * Добавляет трек в плейлист
   * @param {string} playlistId - ID плейлиста
   * @param {Object} trackData - Данные трека (trackId, position)
   * @returns {Promise<Object>} - Обновленный объект плейлиста
   */
  async addTrackToPlaylist(playlistId, trackData) {
    const response = await apiClient.post(`/playlists/${playlistId}/tracks`, trackData);
    return response.data;
  }

  /**
   * Удаляет трек из плейлиста
   * @param {string} playlistId - ID плейлиста
   * @param {string} trackId - ID трека
   * @returns {Promise<Object>} - Обновленный объект плейлиста
   */
  async removeTrackFromPlaylist(playlistId, trackId) {
    const response = await apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`);
    return response.data;
  }

  /**
   * Изменяет порядок треков в плейлисте
   * @param {string} playlistId - ID плейлиста
   * @param {Object} data - Данные порядка треков (trackOrder)
   * @returns {Promise<Object>} - Обновленный объект плейлиста
   */
  async reorderTracks(playlistId, data) {
    const response = await apiClient.put(`/playlists/${playlistId}/tracks/reorder`, data);
    return response.data;
  }
}

export default new PlaylistService(); 