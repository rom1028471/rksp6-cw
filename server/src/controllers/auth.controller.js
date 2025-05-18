const authService = require('../services/auth.service');

class AuthController {
  /**
   * Регистрация нового пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async register(req, res, next) {
    try {
      const userData = req.body;
      const result = await authService.register(userData);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Вход пользователя в систему
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const deviceInfo = {
        deviceId: req.body.deviceId,
        deviceName: req.body.deviceName,
        deviceType: req.body.deviceType,
      };
      
      const result = await authService.login(email, password, deviceInfo);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Выход пользователя из системы
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async logout(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.body;
      
      await authService.logout(userId, deviceId);
      
      res.status(200).json({ message: 'Выход выполнен успешно' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Проверка токена
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async validateToken(req, res, next) {
    try {
      const token = req.body.token || req.query.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
      }
      
      const user = await authService.validateToken(token);
      
      if (!user) {
        return res.status(401).json({ message: 'Недействительный токен' });
      }
      
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение текущего пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getCurrentUser(req, res, next) {
    try {
      res.status(200).json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController(); 