const userRepository = require('../repositories/user.repository');
const deviceSessionRepository = require('../repositories/deviceSession.repository');
const fs = require('fs');
const path = require('path');

class UserService {
  /**
   * Получает данные пользователя по ID
   * @param {string} id - ID пользователя
   * @returns {Promise<Object>} - Данные пользователя
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Возвращаем данные пользователя без пароля
    const { password, ...userWithoutPassword } = user.toJSON();
    
    return userWithoutPassword;
  }

  /**
   * Обновляет данные пользователя
   * @param {string} id - ID пользователя
   * @param {Object} userData - Новые данные пользователя
   * @returns {Promise<Object>} - Обновленные данные пользователя
   */
  async updateUser(id, userData) {
    // Проверяем, существует ли пользователь
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Если обновляется email, проверяем, не занят ли он другим пользователем
    if (userData.email && userData.email !== user.email) {
      const existingUser = await userRepository.findByEmail(userData.email);
      
      if (existingUser && existingUser.id !== id) {
        throw new Error('Пользователь с таким email уже существует');
      }
    }
    
    // Если обновляется имя пользователя, проверяем, не занято ли оно другим пользователем
    if (userData.username && userData.username !== user.username) {
      const existingUser = await userRepository.findByUsername(userData.username);
      
      if (existingUser && existingUser.id !== id) {
        throw new Error('Пользователь с таким именем уже существует');
      }
    }
    
    // Обновляем данные пользователя
    const updatedUser = await userRepository.update(id, userData);
    
    // Возвращаем данные пользователя без пароля
    const { password, ...userWithoutPassword } = updatedUser.toJSON();
    
    return userWithoutPassword;
  }

  /**
   * Обновляет аватар пользователя
   * @param {string} id - ID пользователя
   * @param {Object} file - Загруженный файл
   * @returns {Promise<Object>} - Обновленные данные пользователя
   */
  async updateAvatar(id, file) {
    // Проверяем, существует ли пользователь
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Если у пользователя уже есть аватар, удаляем его
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/images', path.basename(user.avatar));
      
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Обновляем аватар пользователя
    const avatarPath = `/uploads/images/${path.basename(file.path)}`;
    const updatedUser = await userRepository.update(id, { avatar: avatarPath });
    
    // Возвращаем данные пользователя без пароля
    const { password, ...userWithoutPassword } = updatedUser.toJSON();
    
    return userWithoutPassword;
  }

  /**
   * Изменяет пароль пользователя
   * @param {string} id - ID пользователя
   * @param {string} oldPassword - Старый пароль
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<boolean>} - Результат операции
   */
  async changePassword(id, oldPassword, newPassword) {
    // Проверяем, существует ли пользователь
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Проверяем старый пароль
    const isPasswordValid = await user.validatePassword(oldPassword);
    
    if (!isPasswordValid) {
      throw new Error('Неверный пароль');
    }
    
    // Обновляем пароль
    await userRepository.update(id, { password: newPassword });
    
    return true;
  }

  /**
   * Удаляет пользователя
   * @param {string} id - ID пользователя
   * @returns {Promise<boolean>} - Результат операции
   */
  async deleteUser(id) {
    // Проверяем, существует ли пользователь
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Удаляем пользователя
    await userRepository.delete(id);
    
    return true;
  }

  /**
   * Получает список устройств пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} - Список устройств
   */
  async getUserDevices(userId) {
    // Проверяем, существует ли пользователь
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Получаем список активных сессий пользователя
    const devices = await deviceSessionRepository.getUserActiveSessions(userId);
    
    return devices;
  }
}

module.exports = new UserService(); 