const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlist.controller');
const { authMiddleware, roleMiddleware, ownerMiddleware } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const { playlistValidation, playlistTrackValidation, validate } = require('../middleware/validator.middleware');
const { Playlist } = require('../models');

/**
 * @swagger
 * /api/playlists:
 *   post:
 *     summary: Создание нового плейлиста
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               isLoop:
 *                 type: boolean
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Плейлист успешно создан
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Требуется авторизация
 */
router.post(
  '/',
  authMiddleware,
  uploadImage.single('cover'),
  playlistValidation,
  validate,
  playlistController.createPlaylist
);

/**
 * @swagger
 * /api/playlists/{id}:
 *   get:
 *     summary: Получение плейлиста по ID
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
 *     responses:
 *       200:
 *         description: Данные плейлиста
 *       404:
 *         description: Плейлист не найден
 */
router.get('/:id', playlistController.getPlaylistById);

/**
 * @swagger
 * /api/playlists/{id}:
 *   put:
 *     summary: Обновление данных плейлиста
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               isLoop:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Данные плейлиста обновлены
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Плейлист не найден
 */
router.put('/:id', authMiddleware, ownerMiddleware(Playlist), playlistValidation, validate, playlistController.updatePlaylist);

/**
 * @swagger
 * /api/playlists/{id}/cover:
 *   put:
 *     summary: Обновление обложки плейлиста
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
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
 *         description: Обложка плейлиста обновлена
 *       400:
 *         description: Файл не загружен
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Плейлист не найден
 */
router.put('/:id/cover', authMiddleware, ownerMiddleware(Playlist), uploadImage.single('file'), playlistController.updateCover);

/**
 * @swagger
 * /api/playlists/{id}:
 *   delete:
 *     summary: Удаление плейлиста
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
 *     responses:
 *       200:
 *         description: Плейлист успешно удален
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Плейлист не найден
 */
router.delete('/:id', authMiddleware, ownerMiddleware(Playlist), playlistController.deletePlaylist);

/**
 * @swagger
 * /api/playlists:
 *   get:
 *     summary: Получение списка плейлистов
 *     tags: [Playlists]
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
 *         description: Количество плейлистов на странице
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос
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
 *         description: Список плейлистов
 */
router.get('/', playlistController.getPlaylists);

/**
 * @swagger
 * /api/playlists/{id}/tracks:
 *   post:
 *     summary: Добавление трека в плейлист
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackId
 *             properties:
 *               trackId:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Трек успешно добавлен в плейлист
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Плейлист или трек не найден
 */
router.post('/:id/tracks', authMiddleware, ownerMiddleware(Playlist), playlistTrackValidation, validate, playlistController.addTrackToPlaylist);

/**
 * @swagger
 * /api/playlists/{id}/tracks/{trackId}:
 *   delete:
 *     summary: Удаление трека из плейлиста
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
 *       - in: path
 *         name: trackId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID трека
 *     responses:
 *       200:
 *         description: Трек успешно удален из плейлиста
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Плейлист не найден
 */
router.delete('/:id/tracks/:trackId', authMiddleware, ownerMiddleware(Playlist), playlistController.removeTrackFromPlaylist);

/**
 * @swagger
 * /api/playlists/{id}/tracks/reorder:
 *   put:
 *     summary: Изменение порядка треков в плейлисте
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID плейлиста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackOrder
 *             properties:
 *               trackOrder:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     trackId:
 *                       type: string
 *                     position:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Порядок треков успешно изменен
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Плейлист не найден
 */
router.put('/:id/tracks/reorder', authMiddleware, ownerMiddleware(Playlist), playlistController.reorderTracks);

module.exports = router; 