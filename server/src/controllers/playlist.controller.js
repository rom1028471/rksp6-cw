const playlistService = require('../services/playlist.service');

class PlaylistController {
  /**
   * Создание нового плейлиста
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async createPlaylist(req, res, next) {
    try {
      const playlistData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const coverFile = req.file;
      
      const playlist = await playlistService.createPlaylist(playlistData, coverFile);
      
      res.status(201).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение плейлиста по ID
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getPlaylistById(req, res, next) {
    try {
      const { id } = req.params;
      
      const playlist = await playlistService.getPlaylistById(id);
      
      res.status(200).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление данных плейлиста
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async updatePlaylist(req, res, next) {
    try {
      const { id } = req.params;
      const playlistData = req.body;
      
      const playlist = await playlistService.updatePlaylist(id, playlistData);
      
      res.status(200).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление обложки плейлиста
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
      
      const playlist = await playlistService.updateCover(id, coverFile);
      
      res.status(200).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление плейлиста
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async deletePlaylist(req, res, next) {
    try {
      const { id } = req.params;
      
      await playlistService.deletePlaylist(id);
      
      res.status(200).json({ message: 'Плейлист успешно удален' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение списка плейлистов
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getPlaylists(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        userId = null,
        isPublic = true,
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        userId,
        isPublic: isPublic === 'false' ? false : isPublic === 'true' ? true : null,
      };
      
      const playlists = await playlistService.getPlaylists(options);
      
      if (!playlists) {
        return res.status(200).json({
          playlists: [],
          totalCount: 0,
          currentPage: parseInt(page),
          totalPages: 0,
        });
      }
      
      res.status(200).json({
        playlists: playlists.rows || [],
        totalCount: playlists.count || 0,
        currentPage: parseInt(page),
        totalPages: Math.ceil((playlists.count || 0) / limit),
      });
    } catch (error) {
      console.error('Ошибка при получении плейлистов:', error);
      res.status(500).json({ message: 'Ошибка сервера при получении плейлистов', error: error.message });
    }
  }

  /**
   * Добавление трека в плейлист
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async addTrackToPlaylist(req, res, next) {
    try {
      const { id } = req.params;
      const { trackId, position } = req.body;
      
      const playlist = await playlistService.addTrackToPlaylist(id, trackId, position);
      
      res.status(200).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление трека из плейлиста
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async removeTrackFromPlaylist(req, res, next) {
    try {
      const { id, trackId } = req.params;
      
      const playlist = await playlistService.removeTrackFromPlaylist(id, trackId);
      
      res.status(200).json(playlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Изменение порядка треков в плейлисте
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async reorderTracks(req, res, next) {
    try {
      const { id } = req.params;
      const { trackOrder } = req.body;
      
      const playlist = await playlistService.reorderTracks(id, trackOrder);
      
      res.status(200).json(playlist);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlaylistController(); 