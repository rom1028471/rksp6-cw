const { Playlist, User, Track, PlaylistTrack } = require('../models');
const { Op } = require('sequelize');

class PlaylistRepository {
  /**
   * Создает новый плейлист
   * @param {Object} playlistData - Данные плейлиста
   * @returns {Promise<Object>} - Созданный плейлист
   */
  async create(playlistData) {
    return await Playlist.create(playlistData);
  }

  /**
   * Находит плейлист по ID
   * @param {string} id - ID плейлиста
   * @returns {Promise<Object|null>} - Найденный плейлист или null
   */
  async findById(id) {
    return await Playlist.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: Track,
          as: 'tracks',
          through: {
            attributes: ['position'],
          },
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
   * Обновляет данные плейлиста
   * @param {string} id - ID плейлиста
   * @param {Object} playlistData - Новые данные плейлиста
   * @returns {Promise<Object|null>} - Обновленный плейлист или null
   */
  async update(id, playlistData) {
    const playlist = await Playlist.findByPk(id);
    
    if (!playlist) {
      return null;
    }
    
    return await playlist.update(playlistData);
  }

  /**
   * Удаляет плейлист
   * @param {string} id - ID плейлиста
   * @returns {Promise<boolean>} - true, если плейлист удален, иначе false
   */
  async delete(id) {
    const playlist = await Playlist.findByPk(id);
    
    if (!playlist) {
      return false;
    }
    
    await playlist.destroy();
    return true;
  }

  /**
   * Получает список плейлистов
   * @param {Object} options - Опции запроса (пагинация, фильтры и т.д.)
   * @returns {Promise<Object>} - Список плейлистов с пагинацией
   */
  async findAll(options = {}) {
    const {
      limit = 10,
      offset = 0,
      userId = null,
      search = '',
      isPublic = true,
      order = [['createdAt', 'DESC']],
    } = options;
    
    const whereClause = {};
    
    // Фильтр по пользователю
    if (userId) {
      whereClause.userId = userId;
    }
    
    // Фильтр по публичности
    if (isPublic !== null) {
      whereClause.isPublic = isPublic;
    }
    
    // Поиск по названию или описанию
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    return await Playlist.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });
  }

  /**
   * Добавляет трек в плейлист
   * @param {string} playlistId - ID плейлиста
   * @param {string} trackId - ID трека
   * @param {number} position - Позиция трека в плейлисте
   * @returns {Promise<Object>} - Созданная связь плейлист-трек
   */
  async addTrack(playlistId, trackId, position = 0) {
    // Если позиция не указана, добавляем трек в конец плейлиста
    if (position === 0) {
      const maxPosition = await PlaylistTrack.max('position', {
        where: { playlistId },
      });
      
      position = (maxPosition || 0) + 1;
    }
    
    return await PlaylistTrack.create({
      playlistId,
      trackId,
      position,
    });
  }

  /**
   * Удаляет трек из плейлиста
   * @param {string} playlistId - ID плейлиста
   * @param {string} trackId - ID трека
   * @returns {Promise<boolean>} - true, если трек удален из плейлиста, иначе false
   */
  async removeTrack(playlistId, trackId) {
    const result = await PlaylistTrack.destroy({
      where: {
        playlistId,
        trackId,
      },
    });
    
    return result > 0;
  }

  /**
   * Изменяет порядок треков в плейлисте
   * @param {string} playlistId - ID плейлиста
   * @param {Array} trackOrder - Массив объектов { trackId, position }
   * @returns {Promise<boolean>} - true, если порядок изменен успешно
   */
  async reorderTracks(playlistId, trackOrder) {
    for (const item of trackOrder) {
      await PlaylistTrack.update(
        { position: item.position },
        {
          where: {
            playlistId,
            trackId: item.trackId,
          },
        }
      );
    }
    
    return true;
  }
}

module.exports = new PlaylistRepository(); 