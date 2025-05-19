import apiClient from './apiClient';

/**
 * Сервис для работы с треками
 */
class TrackService {
  /**
   * Получает список треков
   * @param {Object} params - Параметры запроса (page, limit, search, genre, userId, isPublic)
   * @returns {Promise<Object>} - Список треков с пагинацией
   */
  async getTracks(params = {}) {
    const response = await apiClient.get('/tracks', { params });
    return response.data;
  }

  /**
   * Получает трек по ID
   * @param {string} id - ID трека
   * @returns {Promise<Object>} - Объект трека
   */
  async getTrackById(id) {
    const response = await apiClient.get(`/tracks/${id}`);
    return response.data;
  }

  /**
   * Загружает новый трек
   * @param {FormData} formData - Данные трека и аудио файл
   * @param {Function} onProgress - Функция обратного вызова для отслеживания прогресса загрузки
   * @returns {Promise<Object>} - Созданный объект трека
   */
  async uploadTrack(formData, onProgress = null) {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }
    
    // Логируем содержимое FormData для отладки
    console.log('Отправляемые данные:');
    for (let [key, value] of formData.entries()) {
      if (key === 'audio' || key === 'cover') {
        console.log(key, value.name, value.type, value.size);
      } else {
        console.log(key, value);
      }
    }
    
    try {
      const response = await apiClient.post('/tracks', formData, config);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки трека:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Обновляет информацию о треке
   * @param {string} id - ID трека
   * @param {Object} trackData - Новые данные трека
   * @returns {Promise<Object>} - Обновленный объект трека
   */
  async updateTrack(id, trackData) {
    const response = await apiClient.put(`/tracks/${id}`, trackData);
    return response.data;
  }

  /**
   * Обновляет обложку трека
   * @param {string} id - ID трека
   * @param {File} file - Файл изображения
   * @returns {Promise<Object>} - Обновленный объект трека
   */
  async updateCover(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.put(`/tracks/${id}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * Удаляет трек
   * @param {string} id - ID трека
   * @returns {Promise<Object>} - Сообщение об успешном удалении
   */
  async deleteTrack(id) {
    const response = await apiClient.delete(`/tracks/${id}`);
    return response.data;
  }

  /**
   * Увеличивает счетчик прослушиваний трека
   * @param {string} id - ID трека
   * @returns {Promise<Object>} - Обновленный объект трека
   */
  async incrementPlayCount(id) {
    const response = await apiClient.post(`/tracks/${id}/play`);
    return response.data;
  }

  /**
   * Получает список жанров
   * @returns {Promise<Array>} - Массив жанров
   */
  async getGenres() {
    const response = await apiClient.get('/tracks/genres');
    return response.data;
  }
}

export default new TrackService(); 