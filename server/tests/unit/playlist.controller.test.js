const { mockPlaylists } = require('../mocks/playlist.mock');

// Мокаем зависимости
jest.mock('../../src/services/playlist.service', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addTrackToPlaylist: jest.fn(),
  removeTrackFromPlaylist: jest.fn()
}));

// Импортируем модули после мокирования
const playlistService = require('../../src/services/playlist.service');
const playlistController = require('../../src/controllers/playlist.controller');

describe('Playlist Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      query: {},
      body: {},
      file: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('getAllPlaylists', () => {
    it('должен возвращать все плейлисты пользователя', async () => {
      // Подготовка
      const mockResult = {
        playlists: mockPlaylists,
        count: mockPlaylists.length,
        page: 1,
        totalPages: 1,
        limit: 10
      };
      
      playlistService.getAll.mockResolvedValue(mockResult);

      // Действие
      await playlistController.getAllPlaylists(req, res, next);

      // Проверка
      expect(playlistService.getAll).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      const error = new Error('Тестовая ошибка');
      playlistService.getAll.mockRejectedValue(error);

      // Действие
      await playlistController.getAllPlaylists(req, res, next);

      // Проверка
      expect(playlistService.getAll).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPlaylistById', () => {
    it('должен возвращать плейлист по ID', async () => {
      // Подготовка
      req.params.id = '1';
      playlistService.getById.mockResolvedValue(mockPlaylists[0]);

      // Действие
      await playlistController.getPlaylistById(req, res, next);

      // Проверка
      expect(playlistService.getById).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPlaylists[0]);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если плейлист не найден', async () => {
      // Подготовка
      req.params.id = '999';
      playlistService.getById.mockResolvedValue(null);

      // Действие
      await playlistController.getPlaylistById(req, res, next);

      // Проверка
      expect(playlistService.getById).toHaveBeenCalledWith('999', 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Плейлист не найден' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      const error = new Error('Тестовая ошибка');
      playlistService.getById.mockRejectedValue(error);

      // Действие
      await playlistController.getPlaylistById(req, res, next);

      // Проверка
      expect(playlistService.getById).toHaveBeenCalledWith('1', 1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createPlaylist', () => {
    it('должен создавать новый плейлист', async () => {
      // Подготовка
      req.body = {
        name: 'New Playlist',
        description: 'A new playlist',
        is_public: true
      };
      
      const newPlaylist = {
        id: 4,
        name: req.body.name,
        description: req.body.description,
        is_public: req.body.is_public,
        userId: 1,
        cover_path: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      playlistService.create.mockResolvedValue(newPlaylist);

      // Действие
      await playlistController.createPlaylist(req, res, next);

      // Проверка
      expect(playlistService.create).toHaveBeenCalledWith({
        ...req.body,
        userId: 1,
        cover: req.file
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newPlaylist);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.body = {
        name: 'New Playlist',
        description: 'A new playlist',
        is_public: true
      };
      
      const error = new Error('Тестовая ошибка');
      playlistService.create.mockRejectedValue(error);

      // Действие
      await playlistController.createPlaylist(req, res, next);

      // Проверка
      expect(playlistService.create).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePlaylist', () => {
    it('должен обновлять плейлист', async () => {
      // Подготовка
      req.params.id = '1';
      req.body = {
        name: 'Updated Playlist',
        description: 'Updated description',
        is_public: false
      };
      
      const updatedPlaylist = {
        ...mockPlaylists[0],
        name: req.body.name,
        description: req.body.description,
        is_public: req.body.is_public
      };
      
      playlistService.update.mockResolvedValue(updatedPlaylist);

      // Действие
      await playlistController.updatePlaylist(req, res, next);

      // Проверка
      expect(playlistService.update).toHaveBeenCalledWith('1', req.body, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedPlaylist);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если плейлист не найден', async () => {
      // Подготовка
      req.params.id = '999';
      req.body = {
        name: 'Updated Playlist',
        description: 'Updated description'
      };
      
      playlistService.update.mockResolvedValue(null);

      // Действие
      await playlistController.updatePlaylist(req, res, next);

      // Проверка
      expect(playlistService.update).toHaveBeenCalledWith('999', req.body, 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Плейлист не найден или вы не имеете прав на его редактирование' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      req.body = {
        name: 'Updated Playlist',
        description: 'Updated description'
      };
      
      const error = new Error('Тестовая ошибка');
      playlistService.update.mockRejectedValue(error);

      // Действие
      await playlistController.updatePlaylist(req, res, next);

      // Проверка
      expect(playlistService.update).toHaveBeenCalledWith('1', req.body, 1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addTrackToPlaylist', () => {
    it('должен добавлять трек в плейлист', async () => {
      // Подготовка
      req.params.id = '1';
      req.body = { trackId: 2 };
      
      playlistService.addTrackToPlaylist.mockResolvedValue(true);

      // Действие
      await playlistController.addTrackToPlaylist(req, res, next);

      // Проверка
      expect(playlistService.addTrackToPlaylist).toHaveBeenCalledWith('1', 2, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Трек добавлен в плейлист' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если плейлист или трек не найдены', async () => {
      // Подготовка
      req.params.id = '999';
      req.body = { trackId: 999 };
      
      playlistService.addTrackToPlaylist.mockResolvedValue(false);

      // Действие
      await playlistController.addTrackToPlaylist(req, res, next);

      // Проверка
      expect(playlistService.addTrackToPlaylist).toHaveBeenCalledWith('999', 999, 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Плейлист или трек не найдены, или у вас нет прав на редактирование плейлиста' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      req.body = { trackId: 2 };
      
      const error = new Error('Тестовая ошибка');
      playlistService.addTrackToPlaylist.mockRejectedValue(error);

      // Действие
      await playlistController.addTrackToPlaylist(req, res, next);

      // Проверка
      expect(playlistService.addTrackToPlaylist).toHaveBeenCalledWith('1', 2, 1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('должен удалять трек из плейлиста', async () => {
      // Подготовка
      req.params.id = '1';
      req.params.trackId = '2';
      
      playlistService.removeTrackFromPlaylist.mockResolvedValue(true);

      // Действие
      await playlistController.removeTrackFromPlaylist(req, res, next);

      // Проверка
      expect(playlistService.removeTrackFromPlaylist).toHaveBeenCalledWith('1', '2', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Трек удален из плейлиста' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если плейлист или трек не найдены', async () => {
      // Подготовка
      req.params.id = '999';
      req.params.trackId = '999';
      
      playlistService.removeTrackFromPlaylist.mockResolvedValue(false);

      // Действие
      await playlistController.removeTrackFromPlaylist(req, res, next);

      // Проверка
      expect(playlistService.removeTrackFromPlaylist).toHaveBeenCalledWith('999', '999', 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Плейлист или трек не найдены, или у вас нет прав на редактирование плейлиста' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      req.params.trackId = '2';
      
      const error = new Error('Тестовая ошибка');
      playlistService.removeTrackFromPlaylist.mockRejectedValue(error);

      // Действие
      await playlistController.removeTrackFromPlaylist(req, res, next);

      // Проверка
      expect(playlistService.removeTrackFromPlaylist).toHaveBeenCalledWith('1', '2', 1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 