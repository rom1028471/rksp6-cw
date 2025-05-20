const { mockTracks } = require('../mocks/track.mock');

// Мокаем зависимости
jest.mock('../../src/services/track.service', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  incrementPlayCount: jest.fn(),
  getStreamUrl: jest.fn()
}));

// Импортируем модули после мокирования
const trackService = require('../../src/services/track.service');
const trackController = require('../../src/controllers/track.controller');

describe('Track Controller', () => {
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

  describe('getAllTracks', () => {
    it('должен возвращать все треки', async () => {
      // Подготовка
      trackService.getAll.mockResolvedValue({
        tracks: [mockTracks[0], mockTracks[1]],
        count: 2,
        page: 1,
        totalPages: 1,
        limit: 10
      });

      // Действие
      await trackController.getAllTracks(req, res, next);

      // Проверка
      expect(trackService.getAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        tracks: [mockTracks[0], mockTracks[1]],
        count: 2,
        page: 1,
        totalPages: 1,
        limit: 10
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      const error = new Error('Тестовая ошибка');
      trackService.getAll.mockRejectedValue(error);

      // Действие
      await trackController.getAllTracks(req, res, next);

      // Проверка
      expect(trackService.getAll).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTrackById', () => {
    it('должен возвращать трек по ID', async () => {
      // Подготовка
      req.params.id = '1';
      trackService.getById.mockResolvedValue(mockTracks[0]);

      // Действие
      await trackController.getTrackById(req, res, next);

      // Проверка
      expect(trackService.getById).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTracks[0]);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если трек не найден', async () => {
      // Подготовка
      req.params.id = '999';
      trackService.getById.mockResolvedValue(null);

      // Действие
      await trackController.getTrackById(req, res, next);

      // Проверка
      expect(trackService.getById).toHaveBeenCalledWith('999', 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Трек не найден' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      const error = new Error('Тестовая ошибка');
      trackService.getById.mockRejectedValue(error);

      // Действие
      await trackController.getTrackById(req, res, next);

      // Проверка
      expect(trackService.getById).toHaveBeenCalledWith('1', 1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createTrack', () => {
    it('должен создавать новый трек', async () => {
      // Подготовка
      req.body = {
        title: 'New Track',
        artist: 'New Artist',
        genre: 'Rock'
      };
      req.file = {
        filename: 'new-track.mp3',
        path: '/uploads/tracks/new-track.mp3'
      };
      const newTrack = {
        ...mockTracks[0],
        id: 4,
        title: req.body.title,
        artist: req.body.artist,
        genre: req.body.genre,
        file_path: req.file.path
      };
      trackService.create.mockResolvedValue(newTrack);

      // Действие
      await trackController.createTrack(req, res, next);

      // Проверка
      expect(trackService.create).toHaveBeenCalledWith({
        ...req.body,
        userId: 1,
        file: req.file
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newTrack);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.body = {
        title: 'New Track',
        artist: 'New Artist'
      };
      req.file = {
        filename: 'new-track.mp3',
        path: '/uploads/tracks/new-track.mp3'
      };
      const error = new Error('Тестовая ошибка');
      trackService.create.mockRejectedValue(error);

      // Действие
      await trackController.createTrack(req, res, next);

      // Проверка
      expect(trackService.create).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('incrementPlayCount', () => {
    it('должен увеличивать счетчик прослушиваний трека', async () => {
      // Подготовка
      req.params.id = '1';
      const updatedTrack = {
        ...mockTracks[0],
        play_count: mockTracks[0].play_count + 1
      };
      trackService.incrementPlayCount.mockResolvedValue(updatedTrack);

      // Действие
      await trackController.incrementPlayCount(req, res, next);

      // Проверка
      expect(trackService.incrementPlayCount).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedTrack);
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если трек не найден', async () => {
      // Подготовка
      req.params.id = '999';
      trackService.incrementPlayCount.mockResolvedValue(null);

      // Действие
      await trackController.incrementPlayCount(req, res, next);

      // Проверка
      expect(trackService.incrementPlayCount).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Трек не найден' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      const error = new Error('Тестовая ошибка');
      trackService.incrementPlayCount.mockRejectedValue(error);

      // Действие
      await trackController.incrementPlayCount(req, res, next);

      // Проверка
      expect(trackService.incrementPlayCount).toHaveBeenCalledWith('1');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getStreamUrl', () => {
    it('должен возвращать URL для потокового воспроизведения', async () => {
      // Подготовка
      req.params.id = '1';
      const streamUrl = '/streams/test-track-1/playlist.m3u8';
      trackService.getStreamUrl.mockResolvedValue(streamUrl);

      // Действие
      await trackController.getStreamUrl(req, res, next);

      // Проверка
      expect(trackService.getStreamUrl).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ url: streamUrl });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен возвращать 404, если трек не найден', async () => {
      // Подготовка
      req.params.id = '999';
      trackService.getStreamUrl.mockResolvedValue(null);

      // Действие
      await trackController.getStreamUrl(req, res, next);

      // Проверка
      expect(trackService.getStreamUrl).toHaveBeenCalledWith('999', 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Трек не найден или недоступен для воспроизведения' });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен передать ошибку middleware next при возникновении исключения', async () => {
      // Подготовка
      req.params.id = '1';
      const error = new Error('Тестовая ошибка');
      trackService.getStreamUrl.mockRejectedValue(error);

      // Действие
      await trackController.getStreamUrl(req, res, next);

      // Проверка
      expect(trackService.getStreamUrl).toHaveBeenCalledWith('1', 1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 