const express = require('express');
const { PlaybackPosition, User, Track, UserDevice, Sequelize } = require('../models');
const { authMiddleware } = require('../middleware/auth.middleware');
const router = express.Router();
const { Op } = Sequelize;

/**
 * Получение текущей позиции воспроизведения
 */
router.get('/position', authMiddleware, async (req, res) => {
  try {
    const { userId, deviceId } = req.query;
    
    // Проверка прав доступа
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Нет доступа к данным этого пользователя' });
    }

    // Находим последнюю активную запись воспроизведения для пользователя
    const latestPosition = await PlaybackPosition.findOne({
      where: {
        userId: userId,
        deviceId: { [Op.ne]: deviceId } // Любое устройство кроме текущего
      },
      order: [['updatedAt', 'DESC']],
      include: [{ model: Track }]
    });

    if (!latestPosition) {
      return res.json({
        track: null,
        position: 0,
        isPlaying: false
      });
    }

    // Обновляем время последней активности пользователя
    await User.update(
      { lastActive: new Date() },
      { where: { id: userId } }
    );

    res.json({
      track: latestPosition.Track || null,
      position: latestPosition.position || 0,
      isPlaying: latestPosition.isPlaying || false,
      deviceId: latestPosition.deviceId || null,
      updatedAt: latestPosition.updatedAt || new Date()
    });
  } catch (error) {
    console.error('Ошибка при получении позиции воспроизведения:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

/**
 * Сохранение позиции воспроизведения
 */
router.post('/position', authMiddleware, async (req, res) => {
  try {
    const { userId, deviceId, trackId, position, isPlaying } = req.body;
    
    // Проверка прав доступа
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Нет доступа к данным этого пользователя' });
    }

    // Находим или создаем запись о позиции воспроизведения
    const [playbackPosition, created] = await PlaybackPosition.findOrCreate({
      where: {
        userId: userId,
        deviceId: deviceId
      },
      defaults: {
        userId: userId,
        deviceId: deviceId,
        trackId: trackId,
        position: position,
        isPlaying: isPlaying
      }
    });

    // Если запись уже существовала, обновляем ее
    if (!created) {
      await playbackPosition.update({
        trackId: trackId,
        position: position,
        isPlaying: isPlaying
      });
    }

    // Обновляем время последней активности пользователя
    await User.update(
      { lastActive: new Date() },
      { where: { id: userId } }
    );

    // Обновляем время последней активности устройства
    await UserDevice.update(
      { last_active: new Date() },
      { where: { user_id: userId, device_id: deviceId } }
    );

    res.json({
      message: 'Позиция воспроизведения успешно сохранена',
      playbackPosition
    });
  } catch (error) {
    console.error('Ошибка при сохранении позиции воспроизведения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * Получение позиций воспроизведения для всех устройств пользователя
 */
router.get('/devices', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const positions = await PlaybackPosition.findAll({
      where: { userId: userId },
      include: [{ model: Track }],
      order: [['updatedAt', 'DESC']]
    });

    res.json(positions);
  } catch (error) {
    console.error('Ошибка при получении позиций воспроизведения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * Синхронизация воспроизведения между устройствами
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { sourceDeviceId, targetDeviceId } = req.body;
    const userId = req.user.id;
    
    // Проверяем, есть ли позиция воспроизведения на исходном устройстве
    const sourcePosition = await PlaybackPosition.findOne({
      where: { 
        userId: userId,
        deviceId: sourceDeviceId
      },
      include: [{ model: Track }]
    });
    
    if (!sourcePosition) {
      return res.status(404).json({ 
        message: 'Не найдена информация о воспроизведении на исходном устройстве' 
      });
    }
    
    // Обновляем или создаем запись для целевого устройства
    const [targetPosition, created] = await PlaybackPosition.findOrCreate({
      where: {
        userId: userId,
        deviceId: targetDeviceId
      },
      defaults: {
        userId: userId,
        deviceId: targetDeviceId,
        trackId: sourcePosition.trackId,
        position: sourcePosition.position,
        isPlaying: sourcePosition.isPlaying
      }
    });
    
    // Если запись уже существовала, обновляем ее
    if (!created) {
      await targetPosition.update({
        trackId: sourcePosition.trackId,
        position: sourcePosition.position,
        isPlaying: sourcePosition.isPlaying
      });
    }
    
    res.json({
      message: 'Синхронизация воспроизведения успешно выполнена',
      sourcePosition,
      targetPosition
    });
  } catch (error) {
    console.error('Ошибка при синхронизации воспроизведения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * Отключение синхронизации для устройства
 */
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user.id;
    
    // Останавливаем воспроизведение на устройстве
    const playbackPosition = await PlaybackPosition.findOne({
      where: {
        userId: userId,
        deviceId: deviceId
      }
    });
    
    if (playbackPosition) {
      await playbackPosition.update({
        isPlaying: false
      });
    }
    
    res.json({
      message: 'Устройство успешно отключено от синхронизации',
      deviceId
    });
  } catch (error) {
    console.error('Ошибка при отключении устройства:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * Получение активных сессий воспроизведения
 */
router.get('/active-sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Получаем все активные сессии воспроизведения
    const activePositions = await PlaybackPosition.findAll({
      where: { 
        userId: userId,
        isPlaying: true 
      },
      include: [{ model: Track }],
      order: [['updatedAt', 'DESC']]
    });
    
    // Обогащаем данными об устройствах
    const devices = await UserDevice.findAll({
      where: {
        user_id: userId
      }
    });
    
    const activeSessions = activePositions.map(position => {
      const device = devices.find(d => d.device_id === position.deviceId) || {};
      return {
        position: position.toJSON(),
        device: {
          id: device.id,
          deviceId: device.device_id,
          deviceName: device.device_name,
          deviceType: device.device_type,
          lastActive: device.last_active
        }
      };
    });
    
    res.json(activeSessions);
  } catch (error) {
    console.error('Ошибка при получении активных сессий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router; 