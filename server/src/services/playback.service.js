const playHistoryRepository = require('../repositories/playHistory.repository');
const deviceSessionRepository = require('../repositories/deviceSession.repository');
const trackRepository = require('../repositories/track.repository');

class PlaybackService {
  /**
   * Обновляет позицию воспроизведения для трека и пользователя
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @param {number} position - Позиция воспроизведения в секундах
   * @param {boolean} isPlaying - Статус воспроизведения
   * @returns {Promise<Object>} - Обновленная история и сессия устройства
   */
  async updatePlaybackPosition(userId, trackId, deviceId, position, isPlaying) {
    // Проверяем, существует ли трек
    const track = await trackRepository.findById(trackId);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Обновляем позицию воспроизведения в истории
    const history = await playHistoryRepository.updatePosition(userId, trackId, deviceId, position);
    
    // Обновляем информацию о текущем воспроизведении в сессии устройства
    let deviceSession = await deviceSessionRepository.findByDeviceAndUser(deviceId, userId);
    
    if (!deviceSession) {
      // Создаем новую сессию устройства, если она не существует
      deviceSession = await deviceSessionRepository.create({
        userId,
        deviceId,
        deviceName: 'Unknown Device',
        deviceType: 'Unknown',
        isActive: true,
        currentTrackId: trackId,
        currentPosition: position,
        isPlaying,
      });
    } else {
      // Обновляем существующую сессию
      deviceSession = await deviceSessionRepository.updatePlaybackInfo(
        deviceSession.id,
        trackId,
        position,
        isPlaying
      );
    }
    
    return {
      history,
      deviceSession,
    };
  }

  /**
   * Отмечает прослушивание трека как завершенное
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object>} - Обновленная история
   */
  async completePlayback(userId, trackId, deviceId) {
    // Отмечаем прослушивание как завершенное
    const history = await playHistoryRepository.markAsCompleted(userId, trackId, deviceId);
    
    if (!history) {
      throw new Error('История прослушивания не найдена');
    }
    
    // Увеличиваем счетчик прослушиваний трека
    await trackRepository.incrementPlayCount(trackId);
    
    return history;
  }

  /**
   * Получает историю прослушиваний пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} options - Опции запроса (пагинация, сортировка и т.д.)
   * @returns {Promise<Object>} - История прослушиваний с пагинацией
   */
  async getUserHistory(userId, options = {}) {
    return await playHistoryRepository.getUserHistory(userId, options);
  }

  /**
   * Получает последнюю позицию воспроизведения для трека и пользователя
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @returns {Promise<Object|null>} - Последняя запись в истории или null
   */
  async getLastTrackPosition(userId, trackId) {
    return await playHistoryRepository.getLastTrackHistory(userId, trackId);
  }

  /**
   * Получает информацию о текущем воспроизведении на устройстве
   * @param {string} userId - ID пользователя
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object|null>} - Информация о текущем воспроизведении или null
   */
  async getCurrentPlayback(userId, deviceId) {
    // Получаем сессию устройства
    const deviceSession = await deviceSessionRepository.findByDeviceAndUser(deviceId, userId);
    
    if (!deviceSession || !deviceSession.currentTrackId) {
      return null;
    }
    
    // Получаем информацию о треке
    const track = await trackRepository.findById(deviceSession.currentTrackId);
    
    if (!track) {
      return null;
    }
    
    return {
      track,
      position: deviceSession.currentPosition,
      isPlaying: deviceSession.isPlaying,
    };
  }

  /**
   * Получает список активных устройств пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} - Список активных устройств
   */
  async getUserActiveDevices(userId) {
    return await deviceSessionRepository.getUserActiveSessions(userId);
  }

  /**
   * Синхронизирует воспроизведение между устройствами
   * @param {string} userId - ID пользователя
   * @param {string} sourceDeviceId - ID исходного устройства
   * @param {string} targetDeviceId - ID целевого устройства
   * @returns {Promise<Object>} - Информация о синхронизированном воспроизведении
   */
  async syncPlayback(userId, sourceDeviceId, targetDeviceId) {
    // Получаем информацию о текущем воспроизведении на исходном устройстве
    const sourcePlayback = await this.getCurrentPlayback(userId, sourceDeviceId);
    
    if (!sourcePlayback) {
      throw new Error('На исходном устройстве нет активного воспроизведения');
    }
    
    // Обновляем информацию о воспроизведении на целевом устройстве
    await this.updatePlaybackPosition(
      userId,
      sourcePlayback.track.id,
      targetDeviceId,
      sourcePlayback.position,
      sourcePlayback.isPlaying
    );
    
    return sourcePlayback;
  }
}

module.exports = new PlaybackService(); 