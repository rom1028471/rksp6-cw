const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth.middleware');
const { trackService } = require('../services/track.service');
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
router.get('/hls/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await trackService.getTrackById(trackId);
    
    if (!track) {
      return res.status(404).json({ message: 'Трек не найден' });
    }
    
    // Проверка прав доступа (если трек не публичный, то проверяем владельца)
    if (!track.isPublic && track.userId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет доступа к этому треку' });
    }
    
    // Получаем путь к манифесту
    const manifestPath = hlsUtils.getManifestPath(trackId);
    
    // Проверяем существование манифеста
    if (!fs.existsSync(manifestPath)) {
      // Если манифеста нет, создаем его
      await hlsUtils.generateHlsSegments(track.filePath, trackId);
    }
    
    // Отправляем манифест
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
router.get('/hls/:trackId/:segmentId', authMiddleware, async (req, res) => {
  try {
    const { trackId, segmentId } = req.params;
    
    // Получаем путь к сегменту
    const segmentPath = hlsUtils.getSegmentPath(trackId, segmentId);
    
    // Проверяем существование сегмента
    if (!fs.existsSync(segmentPath)) {
      return res.status(404).json({ message: 'Сегмент не найден' });
    }
    
    // Отправляем сегмент
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
router.get('/audio/:trackId', authMiddleware, async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await trackService.getTrackById(trackId);
    
    if (!track) {
      return res.status(404).json({ message: 'Трек не найден' });
    }
    
    // Проверка прав доступа (если трек не публичный, то проверяем владельца)
    if (!track.isPublic && track.userId !== req.user.id) {
      return res.status(403).json({ message: 'У вас нет доступа к этому треку' });
    }
    
    // Проверяем существование файла
    if (!fs.existsSync(track.filePath)) {
      return res.status(404).json({ message: 'Аудиофайл не найден' });
    }
    
    // Получаем размер файла
    const stat = fs.statSync(track.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Если запрошен диапазон байтов, отправляем только часть файла
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(track.filePath, {start, end});
      
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
      fs.createReadStream(track.filePath).pipe(res);
    }
  } catch (error) {
    console.error('Ошибка при потоковой передаче аудио:', error);
    res.status(500).json({ message: 'Ошибка при потоковой передаче аудио' });
  }
});

module.exports = router; 