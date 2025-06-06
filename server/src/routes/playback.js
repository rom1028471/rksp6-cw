const express = require('express');
const { PlaybackPosition, User, Track, UserDevice, Sequelize } = require('../models');
const { checkAuth } = require('../middleware/auth.middleware');
const router = express.Router();
const { Op } = Sequelize;

/**
 * Получение текущей позиции воспроизведения
 */
router.get('/position', checkAuth({ required: true }), async (req, res) => {
  try {
    // Используем только ID пользователя из JWT токена, игнорируем userId из запроса
    const userId = req.user.id;
    const { deviceId } = req.query;
    
    console.log(`Получение позиции для пользователя ${userId}, устройство: ${deviceId}`);

    // Находим последнюю активную запись воспроизведения для пользователя
    const latestPosition = await PlaybackPosition.findOne({
      where: {
        userId: userId,
      },
      order: [['updatedAt', 'DESC']],
      include: [{ 
        model: Track,
        // Добавляем проверку, что трек принадлежит пользователю или публичный
        where: {
          [Op.or]: [
            { user_id: userId },
            { userId: userId },
            { is_public: true }
          ]
        }
      }]
    });

    if (!latestPosition || !latestPosition.Track) {
      console.log(`Не найдена позиция воспроизведения для пользователя ${userId}`);
      return res.json({
        track: null,
        position: 0,
        isPlaying: false
      });
    }

    console.log(`Найдена позиция для пользователя ${userId}:`, {
      trackId: latestPosition.trackId,
      trackTitle: latestPosition.Track.title,
      position: latestPosition.position
    });

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
router.post('/position', checkAuth({ required: true }), async (req, res) => {
  try {
    // Берем ID пользователя из токена
    const userId = req.user.id;
    const { deviceId, trackId, position, isPlaying } = req.body;
    
    console.log(`Сохранение позиции для пользователя ${userId}:`, {
      deviceId, trackId, position, isPlaying
    });

    // Проверка существования трека
    const track = await Track.findByPk(trackId);
    if (!track) {
      console.error(`Трек с ID ${trackId} не найден`);
      return res.status(404).json({ message: 'Трек не найден' });
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

    console.log('Позиция успешно сохранена');
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
router.get('/devices', checkAuth({ required: true }), async (req, res) => {
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
router.post('/sync', checkAuth({ required: true }), async (req, res) => {
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
router.post('/disconnect', checkAuth({ required: true }), async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user.id;
    
    console.log('Отключение устройства:', { userId, deviceId });
    
    if (!deviceId) {
      console.error('Ошибка: deviceId не указан в запросе');
      return res.status(400).json({ message: 'Необходимо указать deviceId' });
    }

    // Поиск устройства по device_id
    const device = await UserDevice.findOne({
      where: {
        device_id: deviceId,
        user_id: userId
      }
    });

    if (!device) {
      console.error('Устройство не найдено:', { deviceId, userId });
      return res.status(404).json({ message: 'Устройство не найдено' });
    }

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
      console.log('Воспроизведение остановлено для устройства:', deviceId);
    } else {
      console.log('Не найдена позиция воспроизведения для устройства:', deviceId);
    }

    res.json({
      message: 'Устройство успешно отключено от синхронизации',
      deviceId: deviceId,
      deviceName: device.device_name
    });
  } catch (error) {
    console.error('Ошибка при отключении устройства:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при отключении устройства',
      error: error.message
    });
  }
});

/**
 * Получение активных сессий воспроизведения
 */
router.get('/active-sessions', checkAuth({ required: true }), async (req, res) => {
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

/**
 * Сброс состояния воспроизведения для клиента
 */
router.post('/reset', (req, res) => {
  try {
    console.log('Клиент запросил сброс состояния воспроизведения');
    // Этот маршрут просто подтверждает запрос, фактический сброс происходит на клиенте
    res.json({
      message: 'Состояние воспроизведения сброшено',
      success: true
    });
  } catch (error) {
    console.error('Ошибка при сбросе состояния воспроизведения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router; 