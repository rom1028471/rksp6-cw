const { Track, User, sequelize } = require('../models');
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
          attributes: ['id', 'username', 'avatar_path'],
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
  async findAll(options) {
    console.log('[TrackRepository] Получены опции:', JSON.stringify(options, null, 2));
    
    const { limit, offset, search, genre, sort, requestingUserId, filter } = options;
    
    const whereConditions = [];

    // 1. Фильтр по поисковому запросу
    if (search) {
      console.log(`[TrackRepository] Применен поиск по строке: "${search}"`);
      whereConditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { artist: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    // 2. Фильтр по жанру
    if (genre) {
      console.log(`[TrackRepository] Применен фильтр по жанру: "${genre}"`);
      whereConditions.push({ genre: genre });
    }

    // 3. Логика видимости и принадлежности
    if (filter === 'my' && requestingUserId) {
      // СТРОГО: Только треки этого пользователя (публичные и приватные)
      console.log(`[TrackRepository] Применен фильтр 'Только мои' для пользователя ID: ${requestingUserId}`);
      
      // Проверяем оба возможных поля для совместимости
      whereConditions.push({
        [Op.or]: [
          { user_id: requestingUserId },
          { userId: requestingUserId }
        ]
      });
    } else {
      // Стандартный просмотр
      if (requestingUserId) {
        // ЗАЛОГИНЕННЫЙ ПОЛЬЗОВАТЕЛЬ: видит все публичные треки ИЛИ свои приватные
        console.log(`[TrackRepository] Пользователь ID: ${requestingUserId} просматривает публичные треки и свои приватные.`);
        whereConditions.push({
          [Op.or]: [
            { is_public: true },
            {
              [Op.and]: [
                { 
                  [Op.or]: [
                    { user_id: requestingUserId },
                    { userId: requestingUserId }
                  ]
                },
                { is_public: false }
              ]
            }
          ]
        });
      } else {
        // ГОСТЬ: видит только публичные треки
        console.log('[TrackRepository] Гость просматривает только публичные треки.');
        whereConditions.push({ is_public: true });
      }
    }
    
    const whereClause = { [Op.and]: whereConditions };
    console.log('[TrackRepository] Итоговый WHERE-объект:', JSON.stringify(whereClause, null, 2));

    let orderClause;
    switch (sort) {
      case 'popular':
        orderClause = [['play_count', 'DESC']];
        break;
      case 'oldest':
        orderClause = [['created_at', 'ASC']];
        break;
      case 'title_asc':
        orderClause = [['title', 'ASC']];
        break;
      case 'title_desc':
        orderClause = [['title', 'DESC']];
        break;
      case 'newest':
      default:
        orderClause = [['created_at', 'DESC']];
        break;
    }
    
    console.log(`[TrackRepository] Сортировка: ${sort}, порядок: ${JSON.stringify(orderClause)}`);
    
    const result = await Track.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
      ],
      order: orderClause,
    });
    
    console.log(`[TrackRepository] Найдено ${result.count} треков`);
    
    // Выводим краткую информацию о найденных треках для отладки
    if (result.rows.length > 0) {
      console.log('[TrackRepository] Список найденных треков:');
      result.rows.forEach((track, index) => {
        console.log(`  ${index + 1}. ID: ${track.id}, Название: ${track.title}, Приватный: ${!track.is_public}, Владелец: ${track.user_id || track.userId}`);
      });
    }
    
    return result;
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
    
    return await track.increment('play_count');
  }

  /**
   * Получает список жанров
   * @returns {Promise<Array>} - Список уникальных жанров
   */
  async getGenres() {
    // 1. Получаем все записи, где есть жанр
    const tracks = await Track.findAll({
      attributes: ['genre'],
      where: {
        genre: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      },
      raw: true, // Получаем "сырые" данные для производительности
    });
    
    // 2. Извлекаем только жанры
    const allGenres = tracks.map(track => track.genre);
    
    // 3. Создаем уникальный отсортированный список
    const uniqueGenres = [...new Set(allGenres)];
    
    // 4. Сортируем для единообразного вывода
    uniqueGenres.sort();
    
    return uniqueGenres;
  }
}

module.exports = new TrackRepository(); 