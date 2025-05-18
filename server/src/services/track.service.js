const trackRepository = require('../repositories/track.repository');
const hlsUtils = require('../utils/hls.utils');
const fs = require('fs');
const path = require('path');

class TrackService {
  /**
   * Создает новый трек
   * @param {Object} trackData - Данные трека
   * @param {Object} audioFile - Загруженный аудио файл
   * @param {Object} coverFile - Загруженное изображение обложки (опционально)
   * @returns {Promise<Object>} - Созданный трек
   */
  async createTrack(trackData, audioFile, coverFile = null) {
    try {
      // Получаем информацию о аудио файле
      const audioInfo = await hlsUtils.getAudioInfo(audioFile.path);
      
      // Создаем данные для трека
      const newTrackData = {
        ...trackData,
        duration: audioInfo.duration,
        filePath: `/uploads/audio/${path.basename(audioFile.path)}`,
        coverPath: coverFile ? `/uploads/images/${path.basename(coverFile.path)}` : null,
      };
      
      // Создаем трек в базе данных
      const track = await trackRepository.create(newTrackData);
      
      // Создаем HLS поток для трека
      const streamDir = await hlsUtils.createHLSStream(audioFile.path, track.id);
      
      // Обновляем путь к потоку в базе данных
      const streamPath = `/streams/${track.id}/playlist.m3u8`;
      await trackRepository.update(track.id, { streamPath });
      
      // Получаем обновленный трек
      const updatedTrack = await trackRepository.findById(track.id);
      
      return updatedTrack;
    } catch (error) {
      // В случае ошибки удаляем загруженные файлы
      if (audioFile && fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
      }
      
      if (coverFile && fs.existsSync(coverFile.path)) {
        fs.unlinkSync(coverFile.path);
      }
      
      throw error;
    }
  }

  /**
   * Получает трек по ID
   * @param {string} id - ID трека
   * @returns {Promise<Object>} - Данные трека
   */
  async getTrackById(id) {
    const track = await trackRepository.findById(id);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    return track;
  }

  /**
   * Обновляет данные трека
   * @param {string} id - ID трека
   * @param {Object} trackData - Новые данные трека
   * @returns {Promise<Object>} - Обновленный трек
   */
  async updateTrack(id, trackData) {
    // Проверяем, существует ли трек
    const track = await trackRepository.findById(id);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Обновляем данные трека
    await trackRepository.update(id, trackData);
    
    // Получаем обновленный трек
    const updatedTrack = await trackRepository.findById(id);
    
    return updatedTrack;
  }

  /**
   * Обновляет обложку трека
   * @param {string} id - ID трека
   * @param {Object} coverFile - Загруженное изображение обложки
   * @returns {Promise<Object>} - Обновленный трек
   */
  async updateCover(id, coverFile) {
    // Проверяем, существует ли трек
    const track = await trackRepository.findById(id);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Если у трека уже есть обложка, удаляем ее
    if (track.coverPath) {
      const oldCoverPath = path.join(__dirname, '../..', track.coverPath);
      
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
    }
    
    // Обновляем обложку трека
    const coverPath = `/uploads/images/${path.basename(coverFile.path)}`;
    await trackRepository.update(id, { coverPath });
    
    // Получаем обновленный трек
    const updatedTrack = await trackRepository.findById(id);
    
    return updatedTrack;
  }

  /**
   * Удаляет трек
   * @param {string} id - ID трека
   * @returns {Promise<boolean>} - Результат операции
   */
  async deleteTrack(id) {
    // Проверяем, существует ли трек
    const track = await trackRepository.findById(id);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Удаляем файлы трека
    if (track.filePath) {
      const filePath = path.join(__dirname, '../..', track.filePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (track.coverPath) {
      const coverPath = path.join(__dirname, '../..', track.coverPath);
      
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }
    
    // Удаляем HLS файлы
    await hlsUtils.removeHLSStream(track.id);
    
    // Удаляем трек из базы данных
    await trackRepository.delete(id);
    
    return true;
  }

  /**
   * Получает список треков
   * @param {Object} options - Опции запроса (пагинация, фильтры и т.д.)
   * @returns {Promise<Object>} - Список треков с пагинацией
   */
  async getTracks(options = {}) {
    return await trackRepository.findAll(options);
  }

  /**
   * Увеличивает счетчик прослушиваний трека
   * @param {string} id - ID трека
   * @returns {Promise<Object>} - Обновленный трек
   */
  async incrementPlayCount(id) {
    // Проверяем, существует ли трек
    const track = await trackRepository.findById(id);
    
    if (!track) {
      throw new Error('Трек не найден');
    }
    
    // Увеличиваем счетчик прослушиваний
    await trackRepository.incrementPlayCount(id);
    
    // Получаем обновленный трек
    const updatedTrack = await trackRepository.findById(id);
    
    return updatedTrack;
  }

  /**
   * Получает список жанров
   * @returns {Promise<Array>} - Список уникальных жанров
   */
  async getGenres() {
    return await trackRepository.getGenres();
  }
}

module.exports = new TrackService(); 