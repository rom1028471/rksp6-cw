const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const config = require('../config');

// Устанавливаем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Создает HLS поток из аудио файла
 * @param {string} inputFilePath - Путь к входному аудио файлу
 * @param {string} trackId - Идентификатор трека
 * @returns {Promise<string>} - Путь к директории с HLS файлами
 */
exports.createHLSStream = async (inputFilePath, trackId) => {
  return new Promise((resolve, reject) => {
    try {
      // Создаем директорию для HLS файлов
      const streamDir = path.join(__dirname, '../../', config.storage.streamDir, trackId);
      
      if (!fs.existsSync(streamDir)) {
        fs.mkdirSync(streamDir, { recursive: true });
      }
      
      // Путь к плейлисту
      const playlistPath = path.join(streamDir, 'playlist.m3u8');
      
      // Конвертируем аудио в HLS
      ffmpeg(inputFilePath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .audioChannels(2)
        .format('hls')
        .outputOptions([
          `-hls_time ${config.hls.segmentDuration}`,
          `-hls_list_size ${config.hls.playlistSize}`,
          '-hls_segment_filename', path.join(streamDir, 'segment_%03d.ts'),
        ])
        .output(playlistPath)
        .on('end', () => {
          resolve(streamDir);
        })
        .on('error', (err) => {
          reject(new Error(`Ошибка при создании HLS потока: ${err.message}`));
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Получает информацию о аудио файле (длительность, битрейт и т.д.)
 * @param {string} filePath - Путь к аудио файлу
 * @returns {Promise<Object>} - Информация о файле
 */
exports.getAudioInfo = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Ошибка при получении информации о файле: ${err.message}`));
        return;
      }
      
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      
      if (!audioStream) {
        reject(new Error('Аудио поток не найден в файле'));
        return;
      }
      
      resolve({
        duration: Math.floor(metadata.format.duration || 0),
        bitrate: metadata.format.bit_rate,
        sampleRate: audioStream.sample_rate,
        channels: audioStream.channels,
        codec: audioStream.codec_name,
      });
    });
  });
};

/**
 * Удаляет HLS файлы
 * @param {string} trackId - Идентификатор трека
 * @returns {Promise<void>}
 */
exports.removeHLSStream = async (trackId) => {
  return new Promise((resolve, reject) => {
    try {
      const streamDir = path.join(__dirname, '../../', config.storage.streamDir, trackId);
      
      if (fs.existsSync(streamDir)) {
        fs.rm(streamDir, { recursive: true, force: true }, (err) => {
          if (err) {
            reject(new Error(`Ошибка при удалении HLS файлов: ${err.message}`));
            return;
          }
          resolve();
        });
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Получает путь к HLS манифесту
 * @param {string} trackId - Идентификатор трека
 * @returns {string} - Путь к манифесту
 */
exports.getManifestPath = (trackId) => {
  return path.join(__dirname, '../../', config.storage.streamDir, trackId, 'playlist.m3u8');
};

/**
 * Получает путь к HLS сегменту
 * @param {string} trackId - Идентификатор трека
 * @param {string} segmentId - Идентификатор сегмента (например, 'segment_001.ts')
 * @returns {string} - Путь к сегменту
 */
exports.getSegmentPath = (trackId, segmentId) => {
  return path.join(__dirname, '../../', config.storage.streamDir, trackId, segmentId);
};

/**
 * Генерирует HLS сегменты для аудиофайла
 * @param {string} filePath - Путь к аудиофайлу
 * @param {string} trackId - Идентификатор трека
 * @returns {Promise<void>}
 */
exports.generateHlsSegments = async (filePath, trackId) => {
  try {
    await exports.createHLSStream(filePath, trackId);
  } catch (error) {
    throw new Error(`Ошибка при генерации HLS сегментов: ${error.message}`);
  }
};

// Экспортируем все функции как объект для удобства использования в маршрутах
exports.hlsUtils = {
  createHLSStream: exports.createHLSStream,
  getAudioInfo: exports.getAudioInfo,
  removeHLSStream: exports.removeHLSStream,
  getManifestPath: exports.getManifestPath,
  getSegmentPath: exports.getSegmentPath,
  generateHlsSegments: exports.generateHlsSegments
}; 