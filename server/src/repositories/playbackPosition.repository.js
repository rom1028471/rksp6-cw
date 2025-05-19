const { PlaybackPosition } = require('../models');

class PlaybackPositionRepository {
  /**
   * Создает новую запись о позиции воспроизведения
   * @param {Object} data - Данные о позиции воспроизведения
   * @returns {Promise<Object>} - Созданная запись
   */
  async create(data) {
    return await PlaybackPosition.create(data);
  }

  /**
   * Находит позицию воспроизведения по ID
   * @param {number} id - ID записи
   * @returns {Promise<Object|null>} - Найденная запись или null
   */
  async findById(id) {
    return await PlaybackPosition.findByPk(id);
  }

  /**
   * Находит позицию воспроизведения по пользователю, треку и устройству
   * @param {number} userId - ID пользователя
   * @param {number} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object|null>} - Найденная запись или null
   */
  async findByUserTrackDevice(userId, trackId, deviceId) {
    return await PlaybackPosition.findOne({
      where: {
        user_id: userId,
        track_id: trackId,
        device_id: deviceId,
      },
    });
  }

  /**
   * Находит все позиции воспроизведения пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<Array>} - Массив записей
   */
  async findByUser(userId) {
    return await PlaybackPosition.findAll({
      where: {
        user_id: userId,
      },
      include: ['track'],
    });
  }

  /**
   * Обновляет позицию воспроизведения
   * @param {number} id - ID записи
   * @param {Object} data - Новые данные
   * @returns {Promise<Object|null>} - Обновленная запись или null
   */
  async update(id, data) {
    const position = await PlaybackPosition.findByPk(id);
    
    if (!position) {
      return null;
    }
    
    return await position.update(data);
  }

  /**
   * Обновляет или создает позицию воспроизведения
   * @param {number} userId - ID пользователя
   * @param {number} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @param {Object} data - Данные для обновления
   * @returns {Promise<Object>} - Обновленная или созданная запись
   */
  async upsert(userId, trackId, deviceId, data) {
    let position = await this.findByUserTrackDevice(userId, trackId, deviceId);
    
    if (position) {
      return await position.update(data);
    } else {
      return await this.create({
        user_id: userId,
        track_id: trackId,
        device_id: deviceId,
        ...data,
      });
    }
  }

  /**
   * Удаляет позицию воспроизведения
   * @param {number} id - ID записи
   * @returns {Promise<boolean>} - true, если запись удалена, иначе false
   */
  async delete(id) {
    const position = await PlaybackPosition.findByPk(id);
    
    if (!position) {
      return false;
    }
    
    await position.destroy();
    return true;
  }
}

module.exports = new PlaybackPositionRepository(); 