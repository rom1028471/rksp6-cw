const trackService = require('../services/track.service');
const trackRepository = require('../repositories/track.repository');

class TrackController {
  /**
   * Создание нового трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async createTrack(req, res, next) {
    try {
      console.log('Получен запрос на создание трека:');
      console.log('Body:', req.body);
      console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
      console.log('User в запросе:', req.user);
      
      // Проверка наличия данных пользователя
      if (!req.user) {
        console.error('Ошибка: Пользователь не аутентифицирован');
        return res.status(401).json({ message: 'Требуется авторизация' });
      }
      
      // Получаем ID пользователя из токена (проверяем оба возможных поля)
      const userId = req.user.userId || req.user.id;
      
      if (!userId) {
        console.error('Ошибка: ID пользователя отсутствует в токене', req.user);
        return res.status(400).json({ message: 'Некорректный токен авторизации' });
      }

      const trackData = {
        ...req.body,
        is_public: req.body.isPublic === 'true' || req.body.is_public === true,
        userId: userId,
        user_id: userId, // Добавляем оба варианта поля для совместимости
      };
      delete trackData.isPublic;
      
      console.log('Данные трека для создания:', trackData);
      
      // Проверяем наличие файлов
      if (!req.files) {
        console.error('Ошибка: Файлы не загружены');
        return res.status(400).json({ message: 'Файлы не загружены' });
      }
      
      const audioFile = req.files.audio ? req.files.audio[0] : null;
      const coverFile = req.files.cover ? req.files.cover[0] : null;
      
      console.log('Audio file:', audioFile ? {
        fieldname: audioFile.fieldname,
        originalname: audioFile.originalname,
        mimetype: audioFile.mimetype,
        size: audioFile.size,
        path: audioFile.path
      } : 'Not provided');
      
      console.log('Cover file:', coverFile ? {
        fieldname: coverFile.fieldname,
        originalname: coverFile.originalname,
        mimetype: coverFile.mimetype,
        size: coverFile.size,
        path: coverFile.path
      } : 'Not provided');
      
      if (!audioFile) {
        console.error('Ошибка: Аудио файл не загружен');
        return res.status(400).json({ message: 'Аудио файл не загружен' });
      }
      
      const track = await trackService.createTrack(trackData, audioFile, coverFile);
      
      res.status(201).json(track);
    } catch (error) {
      console.error('Ошибка создания трека:', error);
      next(error);
    }
  }

  /**
   * Получение трека по ID
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getTrackById(req, res, next) {
    try {
      const { id } = req.params;
      
      const track = await trackService.getTrackById(id);
      
      res.status(200).json(track);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление данных трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async updateTrack(req, res, next) {
    try {
      const { id } = req.params;
      const trackData = req.body;
      
      const track = await trackService.updateTrack(id, trackData);
      
      res.status(200).json(track);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление обложки трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async updateCover(req, res, next) {
    try {
      const { id } = req.params;
      const coverFile = req.file;
      
      if (!coverFile) {
        return res.status(400).json({ message: 'Файл не загружен' });
      }
      
      const track = await trackService.updateCover(id, coverFile);
      
      res.status(200).json(track);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async deleteTrack(req, res, next) {
    try {
      const { id } = req.params;
      
      await trackService.deleteTrack(id);
      
      res.status(200).json({ message: 'Трек успешно удален' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение списка треков
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getTracks(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        genre = null,
        sort = 'newest',
        filter = '',
      } = req.query;
      
      const options = {
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        search,
        genre,
        sort,
        filter,
        requestingUserId: req.user ? req.user.id : null,
      };

      console.log('Получение треков с параметрами:', JSON.stringify(options, null, 2));
      
      const tracks = await trackService.getTracks(options);
      
      console.log(`Найдено ${tracks.count} треков, возвращаем страницу ${page} из ${Math.ceil(tracks.count / parseInt(limit))}`);
      
      res.status(200).json({
        tracks: tracks.rows,
        totalCount: tracks.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(tracks.count / parseInt(limit)),
      });
    } catch (error) {
      console.error('Ошибка в getTracks контроллере:', error);
      next(error);
    }
  }

  /**
   * Получение списка жанров
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getGenres(req, res, next) {
    try {
      const genres = await trackService.getGenres();
      
      res.status(200).json(genres);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Увеличение счетчика прослушиваний трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async incrementPlayCount(req, res, next) {
    try {
      const { id } = req.params;
      
      await trackService.incrementPlayCount(id);
      
      res.status(200).json({ message: 'Счетчик прослушиваний обновлен' });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res) {
    try {
      // Явно преобразуем строковые параметры из запроса
      const limit = parseInt(req.query.limit, 10) || 10;
      const page = parseInt(req.query.page, 10) || 1;
      const offset = (page - 1) * limit;
      const { search, genre, order } = req.query;
      
      // Новый фильтр для приватных треков
      const showOnlyMyPrivate = req.query.showOnlyMyPrivate === 'true';

      const options = {
        limit,
        offset,
        search,
        genre,
        order,
        requestingUserId: req.user ? req.user.id : null,
        showOnlyMyPrivate,
      };

      const { count, rows } = await trackRepository.findAll(options);
      
      res.json({
        data: rows,
        pagination: {
          total: count,
          limit,
          page,
          totalPages: Math.ceil(count / limit),
          hasMore: page * limit < count,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при получении треков.', error: error.message });
    }
  }
}

module.exports = new TrackController(); 