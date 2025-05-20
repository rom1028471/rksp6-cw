const { mockTracks } = require('../mocks/track.mock');

// Мокаем зависимости
jest.mock('../../src/repositories/track.repository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  incrementPlayCount: jest.fn(),
  searchTracks: jest.fn(),
  getTracksByGenre: jest.fn(),
  getTracksByArtist: jest.fn()
}));

jest.mock('../../src/utils/hls.utils', () => ({
  createHlsStream: jest.fn(),
  getHlsStreamUrl: jest.fn()
}));

jest.mock('fluent-ffmpeg', () => {
  return () => ({
    ffprobe: jest.fn().mockImplementation((_, callback) => {
      callback(null, {
        format: {
          duration: 180,
          bit_rate: 320000
        },
        streams: [
          {
            codec_type: 'audio',
            codec_name: 'mp3',
            channels: 2,
            sample_rate: 44100
          }
        ]
      });
    })
  });
});

// Импортируем модули после мокирования
const trackRepository = require('../../src/repositories/track.repository');
const hlsUtils = require('../../src/utils/hls.utils');
const trackService = require('../../src/services/track.service');

describe('Track Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('должен возвращать все треки с правильной пагинацией', async () => {
      // Подготовка
      const options = { page: 1, limit: 10 };
      const totalCount = mockTracks.length;
      
      trackRepository.findAll.mockResolvedValue({
        rows: mockTracks,
        count: totalCount
      });

      // Действие
      const result = await trackService.getAll(options);

      // Проверка
      expect(trackRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        tracks: mockTracks,
        count: totalCount,
        page: options.page,
        totalPages: Math.ceil(totalCount / options.limit),
        limit: options.limit
      });
    });

    it('должен использовать параметры поиска при наличии', async () => {
      // Подготовка
      const options = { 
        page: 1, 
        limit: 10,
        search: 'test',
        genre: 'Rock',
        artist: 'Test Artist'
      };
      
      trackRepository.searchTracks.mockResolvedValue({
        rows: [mockTracks[0]],
        count: 1
      });
      
      // Действие
      const result = await trackService.getAll(options);

      // Проверка
      expect(trackRepository.searchTracks).toHaveBeenCalledWith(
        options.search,
        expect.objectContaining({
          genre: options.genre,
          artist: options.artist,
          page: options.page,
          limit: options.limit
        })
      );
      expect(result.tracks).toEqual([mockTracks[0]]);
      expect(result.count).toBe(1);
    });
  });

  describe('getById', () => {
    it('должен возвращать трек по ID', async () => {
      // Подготовка
      const trackId = 1;
      const userId = 1;
      
      trackRepository.findById.mockResolvedValue(mockTracks[0]);

      // Действие
      const result = await trackService.getById(trackId, userId);

      // Проверка
      expect(trackRepository.findById).toHaveBeenCalledWith(trackId, userId);
      expect(result).toBe(mockTracks[0]);
    });

    it('должен возвращать null для несуществующего трека', async () => {
      // Подготовка
      const trackId = 999;
      const userId = 1;
      
      trackRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await trackService.getById(trackId, userId);

      // Проверка
      expect(trackRepository.findById).toHaveBeenCalledWith(trackId, userId);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('должен создавать новый трек', async () => {
      // Подготовка
      const trackData = {
        title: 'New Track',
        artist: 'New Artist',
        genre: 'Rock',
        file: {
          path: '/uploads/tracks/new-track.mp3',
          filename: 'new-track.mp3'
        },
        userId: 1
      };
      
      const newTrack = {
        ...mockTracks[0],
        id: 4,
        title: trackData.title,
        artist: trackData.artist,
        genre: trackData.genre,
        file_path: trackData.file.path,
        userId: trackData.userId
      };
      
      trackRepository.create.mockResolvedValue(newTrack);
      hlsUtils.createHlsStream.mockResolvedValue('/streams/new-track');

      // Действие
      const result = await trackService.create(trackData);

      // Проверка
      expect(trackRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: trackData.title,
          artist: trackData.artist,
          genre: trackData.genre,
          file_path: trackData.file.path,
          userId: trackData.userId,
          duration: 180 // из мока ffprobe
        })
      );
      
      expect(hlsUtils.createHlsStream).toHaveBeenCalledWith(
        trackData.file.path,
        expect.any(String)
      );
      
      expect(result).toBe(newTrack);
    });
  });

  describe('incrementPlayCount', () => {
    it('должен увеличивать счетчик прослушиваний', async () => {
      // Подготовка
      const trackId = 1;
      const updatedTrack = {
        ...mockTracks[0],
        play_count: mockTracks[0].play_count + 1
      };
      
      trackRepository.incrementPlayCount.mockResolvedValue(updatedTrack);

      // Действие
      const result = await trackService.incrementPlayCount(trackId);

      // Проверка
      expect(trackRepository.incrementPlayCount).toHaveBeenCalledWith(trackId);
      expect(result.play_count).toBe(mockTracks[0].play_count + 1);
    });

    it('должен возвращать null для несуществующего трека', async () => {
      // Подготовка
      const trackId = 999;
      
      trackRepository.incrementPlayCount.mockResolvedValue(null);

      // Действие
      const result = await trackService.incrementPlayCount(trackId);

      // Проверка
      expect(trackRepository.incrementPlayCount).toHaveBeenCalledWith(trackId);
      expect(result).toBeNull();
    });
  });

  describe('getStreamUrl', () => {
    it('должен возвращать URL для потокового воспроизведения', async () => {
      // Подготовка
      const trackId = 1;
      const userId = 1;
      const streamUrl = '/streams/test-track-1/playlist.m3u8';
      
      trackRepository.findById.mockResolvedValue(mockTracks[0]);
      hlsUtils.getHlsStreamUrl.mockReturnValue(streamUrl);

      // Действие
      const result = await trackService.getStreamUrl(trackId, userId);

      // Проверка
      expect(trackRepository.findById).toHaveBeenCalledWith(trackId, userId);
      expect(hlsUtils.getHlsStreamUrl).toHaveBeenCalledWith(expect.any(String));
      expect(result).toBe(streamUrl);
    });

    it('должен возвращать null для несуществующего трека', async () => {
      // Подготовка
      const trackId = 999;
      const userId = 1;
      
      trackRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await trackService.getStreamUrl(trackId, userId);

      // Проверка
      expect(trackRepository.findById).toHaveBeenCalledWith(trackId, userId);
      expect(hlsUtils.getHlsStreamUrl).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
}); 