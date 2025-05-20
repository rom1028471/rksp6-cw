const { mockPlaylists } = require('../mocks/playlist.mock');
const { mockTracks } = require('../mocks/track.mock');

// Мокаем зависимости
jest.mock('../../src/repositories/playlist.repository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  getPlaylistTracks: jest.fn()
}));

jest.mock('../../src/repositories/track.repository', () => ({
  findById: jest.fn()
}));

// Импортируем модули после мокирования
const playlistRepository = require('../../src/repositories/playlist.repository');
const trackRepository = require('../../src/repositories/track.repository');
const playlistService = require('../../src/services/playlist.service');

describe('Playlist Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('должен возвращать все плейлисты с правильной пагинацией', async () => {
      // Подготовка
      const userId = 1;
      const options = { page: 1, limit: 10 };
      const totalCount = mockPlaylists.length;
      
      playlistRepository.findAll.mockResolvedValue({
        rows: mockPlaylists,
        count: totalCount
      });

      // Действие
      const result = await playlistService.getAll(userId, options);

      // Проверка
      expect(playlistRepository.findAll).toHaveBeenCalledWith(userId, options);
      expect(result).toEqual({
        playlists: mockPlaylists,
        count: totalCount,
        page: options.page,
        totalPages: Math.ceil(totalCount / options.limit),
        limit: options.limit
      });
    });
  });

  describe('getById', () => {
    it('должен возвращать плейлист по ID', async () => {
      // Подготовка
      const playlistId = 1;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(mockPlaylists[0]);
      playlistRepository.getPlaylistTracks.mockResolvedValue(mockPlaylists[0].tracks);

      // Действие
      const result = await playlistService.getById(playlistId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.getPlaylistTracks).toHaveBeenCalledWith(playlistId);
      expect(result).toEqual({
        ...mockPlaylists[0],
        tracks: mockPlaylists[0].tracks
      });
    });

    it('должен возвращать null для несуществующего плейлиста', async () => {
      // Подготовка
      const playlistId = 999;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await playlistService.getById(playlistId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.getPlaylistTracks).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('должен возвращать публичный плейлист другого пользователя', async () => {
      // Подготовка
      const playlistId = 1;
      const userId = 2; // Другой пользователь
      const publicPlaylist = { ...mockPlaylists[0], userId: 1 }; // Плейлист принадлежит пользователю 1
      
      playlistRepository.findById.mockResolvedValue(publicPlaylist);
      playlistRepository.getPlaylistTracks.mockResolvedValue(publicPlaylist.tracks);

      // Действие
      const result = await playlistService.getById(playlistId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.getPlaylistTracks).toHaveBeenCalledWith(playlistId);
      expect(result).toEqual({
        ...publicPlaylist,
        tracks: publicPlaylist.tracks
      });
    });
  });

  describe('create', () => {
    it('должен создавать новый плейлист', async () => {
      // Подготовка
      const playlistData = {
        name: 'New Playlist',
        description: 'New playlist description',
        is_public: true,
        userId: 1
      };
      
      const newPlaylist = {
        ...playlistData,
        id: 4,
        cover_path: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tracks: []
      };
      
      playlistRepository.create.mockResolvedValue(newPlaylist);

      // Действие
      const result = await playlistService.create(playlistData);

      // Проверка
      expect(playlistRepository.create).toHaveBeenCalledWith(playlistData);
      expect(result).toBe(newPlaylist);
    });
  });

  describe('update', () => {
    it('должен обновлять существующий плейлист', async () => {
      // Подготовка
      const playlistId = 1;
      const userId = 1;
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description',
        is_public: false
      };
      
      const updatedPlaylist = {
        ...mockPlaylists[0],
        ...updateData
      };
      
      playlistRepository.findById.mockResolvedValue(mockPlaylists[0]);
      playlistRepository.update.mockResolvedValue(updatedPlaylist);

      // Действие
      const result = await playlistService.update(playlistId, updateData, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.update).toHaveBeenCalledWith(playlistId, updateData);
      expect(result).toBe(updatedPlaylist);
    });

    it('должен возвращать null при обновлении несуществующего плейлиста', async () => {
      // Подготовка
      const playlistId = 999;
      const userId = 1;
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description'
      };
      
      playlistRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await playlistService.update(playlistId, updateData, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('должен возвращать null при попытке обновить чужой плейлист', async () => {
      // Подготовка
      const playlistId = 2;
      const userId = 1;
      const updateData = {
        name: 'Updated Playlist',
        description: 'Updated description'
      };
      
      // Плейлист принадлежит пользователю 2
      const otherUserPlaylist = { ...mockPlaylists[1], userId: 2 };
      
      playlistRepository.findById.mockResolvedValue(otherUserPlaylist);

      // Действие
      const result = await playlistService.update(playlistId, updateData, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('addTrackToPlaylist', () => {
    it('должен добавлять трек в плейлист', async () => {
      // Подготовка
      const playlistId = 3; // Пустой плейлист
      const trackId = 1;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(mockPlaylists[2]);
      trackRepository.findById.mockResolvedValue(mockTracks[0]);
      playlistRepository.addTrack.mockResolvedValue(true);

      // Действие
      const result = await playlistService.addTrackToPlaylist(playlistId, trackId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(trackRepository.findById).toHaveBeenCalledWith(trackId);
      expect(playlistRepository.addTrack).toHaveBeenCalledWith(playlistId, trackId);
      expect(result).toBe(true);
    });

    it('должен возвращать false при добавлении трека в несуществующий плейлист', async () => {
      // Подготовка
      const playlistId = 999;
      const trackId = 1;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await playlistService.addTrackToPlaylist(playlistId, trackId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(trackRepository.findById).not.toHaveBeenCalled();
      expect(playlistRepository.addTrack).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('должен возвращать false при добавлении несуществующего трека', async () => {
      // Подготовка
      const playlistId = 1;
      const trackId = 999;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(mockPlaylists[0]);
      trackRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await playlistService.addTrackToPlaylist(playlistId, trackId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(trackRepository.findById).toHaveBeenCalledWith(trackId);
      expect(playlistRepository.addTrack).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('должен удалять трек из плейлиста', async () => {
      // Подготовка
      const playlistId = 1; // Плейлист с треками
      const trackId = 1;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(mockPlaylists[0]);
      playlistRepository.removeTrack.mockResolvedValue(true);

      // Действие
      const result = await playlistService.removeTrackFromPlaylist(playlistId, trackId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.removeTrack).toHaveBeenCalledWith(playlistId, trackId);
      expect(result).toBe(true);
    });

    it('должен возвращать false при удалении трека из несуществующего плейлиста', async () => {
      // Подготовка
      const playlistId = 999;
      const trackId = 1;
      const userId = 1;
      
      playlistRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await playlistService.removeTrackFromPlaylist(playlistId, trackId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.removeTrack).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('должен возвращать false при удалении трека из чужого плейлиста', async () => {
      // Подготовка
      const playlistId = 2;
      const trackId = 3;
      const userId = 1;
      
      // Плейлист принадлежит пользователю 2
      const otherUserPlaylist = { ...mockPlaylists[1], userId: 2 };
      
      playlistRepository.findById.mockResolvedValue(otherUserPlaylist);

      // Действие
      const result = await playlistService.removeTrackFromPlaylist(playlistId, trackId, userId);

      // Проверка
      expect(playlistRepository.findById).toHaveBeenCalledWith(playlistId, userId);
      expect(playlistRepository.removeTrack).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
}); 