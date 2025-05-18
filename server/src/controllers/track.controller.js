const trackService = require('../services/track.service');

class TrackController {
  /**
   * Создание нового трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async createTrack(req, res, next) {
    try {
      const trackData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const audioFile = req.files?.audio?.[0];
      const coverFile = req.files?.cover?.[0];
      
      if (!audioFile) {
        return res.status(400).json({ message: 'Аудио файл не загружен' });
      }
      
      const track = await trackService.createTrack(trackData, audioFile, coverFile);
      
      res.status(201).json(track);
    } catch (error) {
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
        limit = 10,
        search = '',
        genre = null,
        userId = null,
        isPublic = true,
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        genre,
        userId,
        isPublic: isPublic === 'false' ? false : isPublic === 'true' ? true : null,
      };
      
      const tracks = await trackService.getTracks(options);
      
      res.status(200).json({
        tracks: tracks.rows,
        totalCount: tracks.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(tracks.count / limit),
      });
    } catch (error) {
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
      
      const track = await trackService.incrementPlayCount(id);
      
      res.status(200).json(track);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TrackController(); 