const { PlayHistory, Track, User } = require('../models');
const { Op } = require('sequelize');

class PlayHistoryRepository {
  /**
   * Создает новую запись в истории прослушиваний
   * @param {Object} historyData - Данные истории
   * @returns {Promise<Object>} - Созданная запись
   */
  async create(historyData) {
    return await PlayHistory.create(historyData);
  }

  /**
   * Находит запись в истории по ID
   * @param {string} id - ID записи
   * @returns {Promise<Object|null>} - Найденная запись или null
   */
  async findById(id) {
    return await PlayHistory.findByPk(id, {
      include: [
        {
          model: Track,
          as: 'track',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });
  }

  /**
   * Обновляет данные записи в истории
   * @param {string} id - ID записи
   * @param {Object} historyData - Новые данные записи
   * @returns {Promise<Object|null>} - Обновленная запись или null
   */
  async update(id, historyData) {
    const history = await PlayHistory.findByPk(id);
    
    if (!history) {
      return null;
    }
    
    return await history.update(historyData);
  }

  /**
   * Удаляет запись из истории
   * @param {string} id - ID записи
   * @returns {Promise<boolean>} - true, если запись удалена, иначе false
   */
  async delete(id) {
    const history = await PlayHistory.findByPk(id);
    
    if (!history) {
      return false;
    }
    
    await history.destroy();
    return true;
  }

  /**
   * Получает историю прослушиваний пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} options - Опции запроса (пагинация, сортировка и т.д.)
   * @returns {Promise<Object>} - История прослушиваний с пагинацией
   */
  async getUserHistory(userId, options = {}) {
    const { limit = 10, offset = 0, order = [['createdAt', 'DESC']] } = options;
    
    return await PlayHistory.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order,
      include: [
        {
          model: Track,
          as: 'track',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar'],
            },
          ],
        },
      ],
    });
  }

  /**
   * Получает последнюю запись в истории для трека и пользователя
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @returns {Promise<Object|null>} - Последняя запись или null
   */
  async getLastTrackHistory(userId, trackId) {
    return await PlayHistory.findOne({
      where: {
        userId,
        trackId,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Получает последнюю запись в истории для пользователя на устройстве
   * @param {string} userId - ID пользователя
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object|null>} - Последняя запись или null
   */
  async getLastDeviceHistory(userId, deviceId) {
    return await PlayHistory.findOne({
      where: {
        userId,
        deviceId,
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Track,
          as: 'track',
        },
      ],
    });
  }

  /**
   * Обновляет позицию воспроизведения для трека и пользователя
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @param {number} position - Позиция воспроизведения в секундах
   * @returns {Promise<Object>} - Обновленная или созданная запись
   */
  async updatePosition(userId, trackId, deviceId, position) {
    const [history, created] = await PlayHistory.findOrCreate({
      where: {
        userId,
        trackId,
        deviceId,
        completed: false,
      },
      defaults: {
        position,
      },
    });
    
    if (!created) {
      await history.update({ position });
    }
    
    return history;
  }

  /**
   * Отмечает прослушивание как завершенное
   * @param {string} userId - ID пользователя
   * @param {string} trackId - ID трека
   * @param {string} deviceId - ID устройства
   * @returns {Promise<Object|null>} - Обновленная запись или null
   */
  async markAsCompleted(userId, trackId, deviceId) {
    const history = await PlayHistory.findOne({
      where: {
        userId,
        trackId,
        deviceId,
        completed: false,
      },
    });
    
    if (!history) {
      return null;
    }
    
    return await history.update({ completed: true });
  }
}

module.exports = new PlayHistoryRepository(); 