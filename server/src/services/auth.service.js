const userRepository = require('../repositories/user.repository');
const deviceSessionRepository = require('../repositories/deviceSession.repository');
const jwtUtils = require('../utils/jwt.utils');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  /**
   * Регистрирует нового пользователя
   * @param {Object} userData - Данные пользователя
   * @returns {Promise<Object>} - Данные нового пользователя и токен
   */
  async register(userData) {
    // Проверяем, существует ли пользователь с таким email
    const existingUserByEmail = await userRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('Пользователь с таким email уже существует');
    }
    
    // Проверяем, существует ли пользователь с таким именем
    const existingUserByUsername = await userRepository.findByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error('Пользователь с таким именем уже существует');
    }
    
    // Создаем нового пользователя
    const user = await userRepository.create(userData);
    
    // Генерируем JWT токен
    const token = jwtUtils.generateToken(user);
    
    // Возвращаем данные пользователя без пароля и токен
    const { password, ...userWithoutPassword } = user.toJSON();
    
    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Аутентифицирует пользователя
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль пользователя
   * @param {Object} deviceInfo - Информация об устройстве
   * @returns {Promise<Object>} - Данные пользователя и токен
   */
  async login(email, password, deviceInfo = {}) {
    // Находим пользователя по email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Неверный email или пароль');
    }
    
    // Проверяем пароль
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Неверный email или пароль');
    }
    
    // Генерируем JWT токен
    const token = jwtUtils.generateToken(user);
    
    // Обновляем время последней активности пользователя
    await userRepository.updateLastActive(user.id);
    
    // Создаем или обновляем сессию устройства
    const { deviceId = uuidv4(), deviceName = 'Unknown Device', deviceType = 'Unknown' } = deviceInfo;
    
    let deviceSession = await deviceSessionRepository.findByDeviceAndUser(deviceId, user.id);
    
    if (deviceSession) {
      await deviceSessionRepository.update(deviceSession.id, {
        isActive: true,
        lastActive: new Date(),
        deviceName,
        deviceType,
      });
    } else {
      deviceSession = await deviceSessionRepository.create({
        userId: user.id,
        deviceId,
        deviceName,
        deviceType,
        isActive: true,
      });
    }
    
    // Возвращаем данные пользователя без пароля, токен и информацию об устройстве
    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    return {
      user: userWithoutPassword,
      token,
      deviceSession: deviceSession.toJSON(),
    };
  }

  /**
   * Выход пользователя из системы
   * @param {string} userId - ID пользователя
   * @param {string} deviceId - ID устройства
   * @returns {Promise<boolean>} - Результат операции
   */
  async logout(userId, deviceId) {
    const deviceSession = await deviceSessionRepository.findByDeviceAndUser(deviceId, userId);
    
    if (deviceSession) {
      await deviceSessionRepository.update(deviceSession.id, {
        isActive: false,
        isPlaying: false,
      });
    }
    
    return true;
  }

  /**
   * Проверяет валидность токена
   * @param {string} token - JWT токен
   * @returns {Promise<Object|null>} - Данные пользователя или null
   */
  async validateToken(token) {
    const decoded = jwtUtils.verifyToken(token);
    
    if (!decoded) {
      return null;
    }
    
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      return null;
    }
    
    // Возвращаем данные пользователя без пароля
    const { password, ...userWithoutPassword } = user.toJSON();
    
    return userWithoutPassword;
  }
}

module.exports = new AuthService(); 