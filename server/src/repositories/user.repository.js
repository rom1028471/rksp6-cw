const { User } = require('../models');

class UserRepository {
  /**
   * Создает нового пользователя
   * @param {Object} userData - Данные пользователя
   * @returns {Promise<Object>} - Созданный пользователь
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Находит пользователя по ID
   * @param {string} id - ID пользователя
   * @returns {Promise<Object|null>} - Найденный пользователь или null
   */
  async findById(id) {
    return await User.findByPk(id);
  }

  /**
   * Находит пользователя по email
   * @param {string} email - Email пользователя
   * @returns {Promise<Object|null>} - Найденный пользователь или null
   */
  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  /**
   * Находит пользователя по имени пользователя
   * @param {string} username - Имя пользователя
   * @returns {Promise<Object|null>} - Найденный пользователь или null
   */
  async findByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  /**
   * Обновляет данные пользователя
   * @param {string} id - ID пользователя
   * @param {Object} userData - Новые данные пользователя
   * @returns {Promise<Object|null>} - Обновленный пользователь или null
   */
  async update(id, userData) {
    const user = await User.findByPk(id);
    
    if (!user) {
      return null;
    }
    
    return await user.update(userData);
  }

  /**
   * Удаляет пользователя
   * @param {string} id - ID пользователя
   * @returns {Promise<boolean>} - true, если пользователь удален, иначе false
   */
  async delete(id) {
    const user = await User.findByPk(id);
    
    if (!user) {
      return false;
    }
    
    await user.destroy();
    return true;
  }

  /**
   * Получает список всех пользователей
   * @param {Object} options - Опции запроса (пагинация, сортировка и т.д.)
   * @returns {Promise<Array>} - Список пользователей
   */
  async findAll(options = {}) {
    const { limit = 10, offset = 0, order = [['createdAt', 'DESC']] } = options;
    
    return await User.findAndCountAll({
      limit,
      offset,
      order,
      attributes: { exclude: ['password'] },
    });
  }

  /**
   * Обновляет время последней активности пользователя
   * @param {string} id - ID пользователя
   * @returns {Promise<Object|null>} - Обновленный пользователь или null
   */
  async updateLastActive(id) {
    const user = await User.findByPk(id);
    
    if (!user) {
      return null;
    }
    
    return await user.update({ lastActive: new Date() });
  }
}

module.exports = new UserRepository(); 