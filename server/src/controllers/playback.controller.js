const playbackService = require('../services/playback.service');
const playbackRepository = require('../repositories/playback.repository');

class PlaybackController {
  /**
   * Обновление позиции воспроизведения
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async updatePlaybackPosition(req, res, next) {
    try {
      const userId = req.user.id;
      const { trackId, deviceId, position, isPlaying } = req.body;
      
      const result = await playbackService.updatePlaybackPosition(
        userId,
        trackId,
        deviceId,
        position,
        isPlaying
      );
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Завершение воспроизведения трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async completePlayback(req, res, next) {
    try {
      const userId = req.user.id;
      const { trackId, deviceId } = req.body;
      
      const history = await playbackService.completePlayback(userId, trackId, deviceId);
      
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение истории прослушиваний пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getUserHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
      };
      
      const history = await playbackService.getUserHistory(userId, options);
      
      res.status(200).json({
        history: history.rows,
        totalCount: history.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(history.count / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение последней позиции воспроизведения для трека
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getLastTrackPosition(req, res, next) {
    try {
      const userId = req.user.id;
      const { trackId } = req.params;
      
      const position = await playbackService.getLastTrackPosition(userId, trackId);
      
      res.status(200).json(position);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение информации о текущем воспроизведении на устройстве
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getCurrentPlayback(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      
      const playback = await playbackService.getCurrentPlayback(userId, deviceId);
      
      res.status(200).json(playback);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение списка активных устройств пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getUserActiveDevices(req, res, next) {
    try {
      const userId = req.user.id;
      
      const devices = await playbackService.getUserActiveDevices(userId);
      
      res.status(200).json(devices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Синхронизация воспроизведения между устройствами
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async syncPlayback(req, res, next) {
    try {
      const userId = req.user.id;
      const { sourceDeviceId, targetDeviceId } = req.body;
      
      const playback = await playbackService.syncPlayback(userId, sourceDeviceId, targetDeviceId);
      
      res.status(200).json(playback);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Сохраняет позицию воспроизведения трека для текущего пользователя.
   */
  async savePosition(req, res) {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован.' });
    }
    const userId = req.user.userId;
    const { trackId, position } = req.body;

    if (!trackId || typeof position === 'undefined') {
      return res.status(400).json({ message: 'Отсутствует trackId или position.' });
    }

    try {
      await playbackRepository.findOrCreatePosition(userId, trackId);
      await playbackRepository.updatePosition(userId, trackId, position);
      res.status(200).json({ message: 'Позиция сохранена.' });
    } catch (error) {
      console.error('Ошибка сохранения позиции:', error);
      res.status(500).json({ message: 'Ошибка сервера при сохранении позиции.' });
    }
  }

  /**
   * Получает последнюю сохраненную позицию для текущего пользователя.
   */
  async getLastPosition(req, res) {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован.' });
    }
    const userId = req.user.userId;

    try {
      const lastPosition = await playbackRepository.getLastPosition(userId);
      if (!lastPosition) {
        return res.status(404).json({ message: 'Сохраненная позиция не найдена.' });
      }

      const response = {
        position: lastPosition.position,
        track: lastPosition.track,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Ошибка получения последней позиции:', error);
      res.status(500).json({ message: 'Ошибка сервера при получении позиции.' });
    }
  }
}

module.exports = new PlaybackController(); 