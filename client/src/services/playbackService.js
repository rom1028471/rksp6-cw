import apiClient from './apiClient';

/**
 * Сервис для управления воспроизведением и синхронизацией между устройствами
 */
class PlaybackService {
  /**
   * Обновляет позицию воспроизведения
   * @param {Object} playbackData - Данные воспроизведения (trackId, deviceId, position, isPlaying)
   * @returns {Promise<Object>} - Обновленные данные истории и сессии устройства
   */
  async updatePosition(playbackData) {
    const response = await apiClient.post('/playback/position', playbackData);
    return response.data;
  }

  /**
   * Отмечает воспроизведение трека как завершенное
   * @param {Object} playbackData - Данные воспроизведения (trackId, deviceId)
   * @returns {Promise<Object>} - Обновленная запись истории
   */
  async completePlayback(playbackData) {
    const response = await apiClient.post('/playback/complete', playbackData);
    return response.data;
  }

  /**
   * Получает историю воспроизведения пользователя
   * @param {Object} params - Параметры запроса (userId, limit, page)
   * @returns {Promise<Object>} - История воспроизведения (элементы, общее количество)
   */
  async getPlaybackHistory(params) {
    const response = await apiClient.get('/playback/history', { params });
    return response.data;
  }

  /**
   * Получает последнюю позицию воспроизведения для трека
   * @param {string} trackId - ID трека
   * @returns {Promise<Object>} - Последняя запись в истории
   */
  async getLastTrackPosition(trackId) {
    const response = await apiClient.get(`/playback/position/${trackId}`);
    return response.data;
  }

  /**
   * Получает информацию о текущем воспроизведении на устройстве
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object>} - Информация о текущем воспроизведении
   */
  async getCurrentPlayback(deviceId) {
    const response = await apiClient.get(`/playback/current/${deviceId}`);
    return response.data;
  }

  /**
   * Получает список активных устройств пользователя
   * @returns {Promise<Array>} - Список активных устройств
   */
  async getUserActiveDevices() {
    const response = await apiClient.get('/playback/devices');
    return response.data;
  }

  /**
   * Синхронизирует воспроизведение между устройствами
   * @param {Object} deviceData - Данные устройств (sourceDeviceId, targetDeviceId)
   * @returns {Promise<Object>} - Информация о синхронизированном воспроизведении
   */
  async syncPlayback(deviceData) {
    const response = await apiClient.post('/playback/sync', deviceData);
    return response.data;
  }

  /**
   * Получает все активные сессии воспроизведения пользователя
   * @returns {Promise<Array>} - Массив активных сессий
   */
  async getActiveSessions() {
    const response = await apiClient.get('/playback/active-sessions');
    return response.data;
  }

  /**
   * Отключает устройство от синхронизации
   * @param {string} deviceId - ID устройства для отключения
   * @returns {Promise<Object>} - Результат операции
   */
  async disconnectDevice(deviceId) {
    const response = await apiClient.post('/playback/disconnect', { deviceId });
    return response.data;
  }

  /**
   * Получает информацию о всех устройствах с активным воспроизведением
   * @returns {Promise<Array>} - Массив устройств с информацией о воспроизведении
   */
  async getActiveDevices() {
    const response = await apiClient.get('/playback/devices');
    return response.data;
  }
}

const instance = new PlaybackService();
export default instance; 