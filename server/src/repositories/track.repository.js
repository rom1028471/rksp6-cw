const { Track, User } = require('../models');
const { Op } = require('sequelize');

class TrackRepository {
  /**
   * Создает новый трек
   * @param {Object} trackData - Данные трека
   * @returns {Promise<Object>} - Созданный трек
   */
  async create(trackData) {
    return await Track.create(trackData);
  }

  /**
   * Находит трек по ID
   * @param {string} id - ID трека
   * @returns {Promise<Object|null>} - Найденный трек или null
   */
  async findById(id) {
    return await Track.findByPk(id, {
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
   * Обновляет данные трека
   * @param {string} id - ID трека
   * @param {Object} trackData - Новые данные трека
   * @returns {Promise<Object|null>} - Обновленный трек или null
   */
  async update(id, trackData) {
    const track = await Track.findByPk(id);
    
    if (!track) {
      return null;
    }
    
    return await track.update(trackData);
  }

  /**
   * Удаляет трек
   * @param {string} id - ID трека
   * @returns {Promise<boolean>} - true, если трек удален, иначе false
   */
  async delete(id) {
    const track = await Track.findByPk(id);
    
    if (!track) {
      return false;
    }
    
    await track.destroy();
    return true;
  }

  /**
   * Получает список треков
   * @param {Object} options - Опции запроса (пагинация, фильтры и т.д.)
   * @returns {Promise<Object>} - Список треков с пагинацией
   */
  async findAll(options = {}) {
    const {
      limit = 10,
      offset = 0,
      userId = null,
      search = '',
      genre = null,
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
    
    // Фильтр по жанру
    if (genre) {
      whereClause.genre = genre;
    }
    
    // Поиск по названию, исполнителю или альбому
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { artist: { [Op.iLike]: `%${search}%` } },
        { album: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    return await Track.findAndCountAll({
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
   * Увеличивает счетчик прослушиваний трека
   * @param {string} id - ID трека
   * @returns {Promise<Object|null>} - Обновленный трек или null
   */
  async incrementPlayCount(id) {
    const track = await Track.findByPk(id);
    
    if (!track) {
      return null;
    }
    
    return await track.increment('playCount');
  }

  /**
   * Получает список жанров
   * @returns {Promise<Array>} - Список уникальных жанров
   */
  async getGenres() {
    const genres = await Track.findAll({
      attributes: ['genre'],
      where: {
        genre: {
          [Op.not]: null,
        },
      },
      group: ['genre'],
    });
    
    return genres.map(item => item.genre);
  }
}

module.exports = new TrackRepository(); 