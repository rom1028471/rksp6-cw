const express = require('express');
const router = express.Router();
const trackController = require('../controllers/track.controller');
const { checkAuth, ownerMiddleware } = require('../middleware/auth.middleware');
const { uploadTrackAndCover, uploadImage } = require('../middleware/upload.middleware');
const { trackValidation, validate } = require('../middleware/validator.middleware');
const { Track } = require('../models');

/**
 * @swagger
 * /api/tracks:
 *   post:
 *     summary: Создание нового трека
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - artist
 *               - audio
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               album:
 *                 type: string
 *               genre:
 *                 type: string
 *               year:
 *                 type: integer
 *               isPublic:
 *                 type: boolean
 *               audio:
 *                 type: string
 *                 format: binary
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Трек успешно создан
 *       400:
 *         description: Ошибка валидации данных или файл не загружен
 *       401:
 *         description: Требуется авторизация
 */
router.post(
  '/',
  checkAuth({ required: true }),
  (req, res, next) => {
    console.log('Запрос на создание трека получен');
    uploadTrackAndCover.fields([
      { name: 'audio', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error('Ошибка загрузки файла:', err);
        return res.status(400).json({ message: 'Ошибка загрузки файла: ' + err.message });
      }

      // Добавим проверку, что аудиофайл действительно был загружен
      if (!req.files || !req.files['audio']) {
        console.error('Файл не был загружен или поле называется не ‘audio’');
        return res.status(400).json({ message: 'Аудиофайл обязателен' });
      }

      console.log('Файлы успешно загружены');
      next();
    });
  },
  trackValidation,
  validate,
  trackController.createTrack
);

/**
 * @swagger
 * /api/tracks/{id}:
 *   get:
 *     summary: Получение трека по ID
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID трека
 *     responses:
 *       200:
 *         description: Данные трека
 *       404:
 *         description: Трек не найден
 */
router.get('/:id', trackController.getTrackById);

/**
 * @swagger
 * /api/tracks/{id}:
 *   put:
 *     summary: Обновление данных трека
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID трека
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               album:
 *                 type: string
 *               genre:
 *                 type: string
 *               year:
 *                 type: integer
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Данные трека обновлены
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Трек не найден
 */
router.put('/:id', checkAuth({ required: true }), ownerMiddleware(Track), trackValidation, validate, trackController.updateTrack);

/**
 * @swagger
 * /api/tracks/{id}/cover:
 *   put:
 *     summary: Обновление обложки трека
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID трека
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Обложка трека обновлена
 *       400:
 *         description: Файл не загружен
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Трек не найден
 */
router.put('/:id/cover', checkAuth({ required: true }), ownerMiddleware(Track), uploadImage.single('file'), trackController.updateCover);

/**
 * @swagger
 * /api/tracks/{id}:
 *   delete:
 *     summary: Удаление трека
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID трека
 *     responses:
 *       200:
 *         description: Трек успешно удален
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Трек не найден
 */
router.delete('/:id', checkAuth({ required: true }), ownerMiddleware(Track), trackController.deleteTrack);

/**
 * @swagger
 * /api/tracks:
 *   get:
 *     summary: Получение списка треков
 *     tags: [Tracks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество треков на странице
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Фильтр по жанру
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Фильтр по ID пользователя
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Фильтр по публичности
 *     responses:
 *       200:
 *         description: Список треков
 */
router.get('/', checkAuth({ required: false }), trackController.getTracks);

/**
 * @swagger
 * /api/tracks/genres:
 *   get:
 *     summary: Получение списка жанров
 *     tags: [Tracks]
 *     responses:
 *       200:
 *         description: Список жанров
 */
router.get('/genres', trackController.getGenres);

/**
 * @swagger
 * /api/tracks/{id}/play:
 *   post:
 *     summary: Увеличение счетчика прослушиваний трека
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID трека
 *     responses:
 *       200:
 *         description: Счетчик прослушиваний увеличен
 *       404:
 *         description: Трек не найден
 */
router.post('/:id/play', trackController.incrementPlayCount);

module.exports = router; 