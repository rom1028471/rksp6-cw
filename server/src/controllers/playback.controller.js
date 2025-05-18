const playbackService = require('../services/playback.service');

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
}

module.exports = new PlaybackController(); 