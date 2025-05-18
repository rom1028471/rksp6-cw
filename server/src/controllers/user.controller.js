const userService = require('../services/user.service');

class UserController {
  /**
   * Получение пользователя по ID
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление данных пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const updatedUser = await userService.updateUser(id, userData);
      
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление аватара пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async updateAvatar(req, res, next) {
    try {
      const { id } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'Файл не загружен' });
      }
      
      const updatedUser = await userService.updateAvatar(id, file);
      
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Изменение пароля пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;
      
      await userService.changePassword(id, oldPassword, newPassword);
      
      res.status(200).json({ message: 'Пароль успешно изменен' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      await userService.deleteUser(id);
      
      res.status(200).json({ message: 'Пользователь успешно удален' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение списка устройств пользователя
   * @param {Object} req - Объект запроса Express
   * @param {Object} res - Объект ответа Express
   * @param {Function} next - Функция next Express
   */
  async getUserDevices(req, res, next) {
    try {
      const { id } = req.params;
      
      const devices = await userService.getUserDevices(id);
      
      res.status(200).json(devices);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController(); 