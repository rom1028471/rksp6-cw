const { DeviceSession, User, Track } = require('../models');
const { Op } = require('sequelize');

class DeviceSessionRepository {
  /**
   * Создает новую сессию устройства
   * @param {Object} sessionData - Данные сессии
   * @returns {Promise<Object>} - Созданная сессия
   */
  async create(sessionData) {
    return await DeviceSession.create(sessionData);
  }

  /**
   * Находит сессию по ID
   * @param {string} id - ID сессии
   * @returns {Promise<Object|null>} - Найденная сессия или null
   */
  async findById(id) {
    return await DeviceSession.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: Track,
          as: 'currentTrack',
        },
      ],
    });
  }

  /**
   * Находит сессию по ID устройства и ID пользователя
   * @param {string} deviceId - ID устройства
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object|null>} - Найденная сессия или null
   */
  async findByDeviceAndUser(deviceId, userId) {
    return await DeviceSession.findOne({
      where: {
        deviceId,
        userId,
      },
      include: [
        {
          model: Track,
          as: 'currentTrack',
        },
      ],
    });
  }

  /**
   * Обновляет данные сессии
   * @param {string} id - ID сессии
   * @param {Object} sessionData - Новые данные сессии
   * @returns {Promise<Object|null>} - Обновленная сессия или null
   */
  async update(id, sessionData) {
    const session = await DeviceSession.findByPk(id);
    
    if (!session) {
      return null;
    }
    
    return await session.update(sessionData);
  }

  /**
   * Удаляет сессию
   * @param {string} id - ID сессии
   * @returns {Promise<boolean>} - true, если сессия удалена, иначе false
   */
  async delete(id) {
    const session = await DeviceSession.findByPk(id);
    
    if (!session) {
      return false;
    }
    
    await session.destroy();
    return true;
  }

  /**
   * Получает список активных сессий пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} - Список активных сессий
   */
  async getUserActiveSessions(userId) {
    return await DeviceSession.findAll({
      where: {
        userId,
        isActive: true,
      },
      include: [
        {
          model: Track,
          as: 'currentTrack',
        },
      ],
    });
  }

  /**
   * Обновляет время последней активности сессии
   * @param {string} id - ID сессии
   * @returns {Promise<Object|null>} - Обновленная сессия или null
   */
  async updateLastActive(id) {
    const session = await DeviceSession.findByPk(id);
    
    if (!session) {
      return null;
    }
    
    return await session.update({
      lastActive: new Date(),
    });
  }

  /**
   * Обновляет информацию о текущем воспроизведении
   * @param {string} id - ID сессии
   * @param {string} trackId - ID трека
   * @param {number} position - Позиция воспроизведения
   * @param {boolean} isPlaying - Статус воспроизведения
   * @returns {Promise<Object|null>} - Обновленная сессия или null
   */
  async updatePlaybackInfo(id, trackId, position, isPlaying) {
    const session = await DeviceSession.findByPk(id);
    
    if (!session) {
      return null;
    }
    
    return await session.update({
      currentTrackId: trackId,
      currentPosition: position,
      isPlaying,
      lastActive: new Date(),
    });
  }

  /**
   * Деактивирует все сессии пользователя, кроме указанной
   * @param {string} userId - ID пользователя
   * @param {string} excludeSessionId - ID сессии, которую не нужно деактивировать
   * @returns {Promise<number>} - Количество деактивированных сессий
   */
  async deactivateOtherSessions(userId, excludeSessionId) {
    const result = await DeviceSession.update(
      { isActive: false },
      {
        where: {
          userId,
          id: {
            [Op.ne]: excludeSessionId,
          },
        },
      }
    );
    
    return result[0];
  }
}

module.exports = new DeviceSessionRepository(); 