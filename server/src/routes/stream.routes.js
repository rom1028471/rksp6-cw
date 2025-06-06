const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { checkAuth } = require('../middleware/auth.middleware');
const trackService = require('../services/track.service');
const { hlsUtils } = require('../utils/hls.utils');

/**
 * @swagger
 * /api/stream/hls/{trackId}:
 *   get:
 *     summary: Получить манифест HLS для трека
 *     description: Возвращает m3u8 манифест для потоковой передачи аудио через HLS
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID трека
 *     responses:
 *       200:
 *         description: M3U8 манифест
 *         content:
 *           application/vnd.apple.mpegurl:
 *             schema:
 *               type: string
 *       404:
 *         description: Трек не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/hls/:trackId', checkAuth({ required: true }), async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await trackService.getTrackById(trackId);
    
    if (!track) {
      return res.status(404).json({ message: 'Трек не найден' });
    }
    
    // Проверка прав доступа (если трек не публичный, то проверяем владельца)
    if (!track.is_public && track.user_id !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет доступа к этому треку' });
    }
    
    const manifestPath = hlsUtils.getManifestPath(trackId);
    
    if (!fs.existsSync(manifestPath)) {
      const fullFilePath = path.join(__dirname, '../..', track.file_path);
      if (!fs.existsSync(fullFilePath)) {
        return res.status(404).json({ message: 'Исходный аудиофайл не найден' });
      }
      await hlsUtils.generateHlsSegments(fullFilePath, trackId);
    }
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.sendFile(manifestPath);
  } catch (error) {
    console.error('Ошибка при получении манифеста HLS:', error);
    res.status(500).json({ message: 'Ошибка при получении манифеста HLS' });
  }
});

/**
 * @swagger
 * /api/stream/hls/{trackId}/{segmentId}:
 *   get:
 *     summary: Получить сегмент HLS для трека
 *     description: Возвращает TS-сегмент для потоковой передачи аудио
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID трека
 *       - in: path
 *         name: segmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID сегмента
 *     responses:
 *       200:
 *         description: TS-сегмент
 *         content:
 *           video/MP2T:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Сегмент не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/hls/:trackId/:segmentId', checkAuth({ required: true }), async (req, res) => {
  try {
    const { trackId, segmentId } = req.params;
    const segmentPath = hlsUtils.getSegmentPath(trackId, segmentId);
    
    if (!fs.existsSync(segmentPath)) {
      return res.status(404).json({ message: 'Сегмент не найден' });
    }
    
    res.setHeader('Content-Type', 'video/MP2T');
    res.sendFile(segmentPath);
  } catch (error) {
    console.error('Ошибка при получении сегмента HLS:', error);
    res.status(500).json({ message: 'Ошибка при получении сегмента HLS' });
  }
});

/**
 * @swagger
 * /api/stream/audio/{trackId}:
 *   get:
 *     summary: Получить аудиофайл напрямую
 *     description: Возвращает аудиофайл для потоковой передачи через HTTP
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID трека
 *     responses:
 *       200:
 *         description: Аудиофайл
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Трек не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/audio/:trackId', checkAuth({ required: true }), async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await trackService.getTrackById(trackId);
    
    if (!track) {
      return res.status(404).json({ message: 'Трек не найден' });
    }
    
    // Проверка прав доступа (если трек не публичный, то проверяем владельца)
    if (!track.is_public && track.user_id !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет доступа к этому треку' });
    }
    
    // Проверяем существование файла
    if (!fs.existsSync(track.file_path)) {
      return res.status(404).json({ message: 'Аудиофайл не найден' });
    }
    
    // Получаем размер файла
    const stat = fs.statSync(track.file_path);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Если запрошен диапазон байтов, отправляем только часть файла
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(track.file_path, {start, end});
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Если диапазон не указан, отправляем весь файл
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      
      res.writeHead(200, head);
      fs.createReadStream(track.file_path).pipe(res);
    }
  } catch (error) {
    console.error('Ошибка при потоковой передаче аудио:', error);
    res.status(500).json({ message: 'Ошибка при потоковой передаче аудио' });
  }
});

module.exports = router; 