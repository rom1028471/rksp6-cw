const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, roleMiddleware, ownerMiddleware } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const { User } = require('../models');

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получение пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       404:
 *         description: Пользователь не найден
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновление данных пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Данные пользователя обновлены
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Пользователь не найден
 */
router.put('/:id', authMiddleware, ownerMiddleware(User), userController.updateUser);

/**
 * @swagger
 * /api/users/{id}/avatar:
 *   put:
 *     summary: Обновление аватара пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
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
 *         description: Аватар пользователя обновлен
 *       400:
 *         description: Файл не загружен
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Пользователь не найден
 */
router.put('/:id/avatar', authMiddleware, ownerMiddleware(User), uploadImage.single('file'), userController.updateAvatar);

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Изменение пароля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *       400:
 *         description: Ошибка валидации данных или неверный пароль
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Пользователь не найден
 */
router.put('/:id/password', authMiddleware, ownerMiddleware(User), userController.changePassword);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удаление пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь успешно удален
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Пользователь не найден
 */
router.delete('/:id', authMiddleware, ownerMiddleware(User), userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/devices:
 *   get:
 *     summary: Получение списка устройств пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Список устройств пользователя
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к этому ресурсу
 *       404:
 *         description: Пользователь не найден
 */
router.get('/:id/devices', authMiddleware, ownerMiddleware(User), userController.getUserDevices);

module.exports = router; 