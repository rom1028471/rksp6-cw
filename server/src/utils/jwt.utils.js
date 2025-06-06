const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Генерирует JWT токен для пользователя
 * @param {Object} user - Объект пользователя
 * @returns {string} - JWT токен
 */
exports.generateToken = (user) => {
  const payload = {
    userId: user.id,
    role: user.role,
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Проверяет JWT токен
 * @param {string} token - JWT токен
 * @returns {Object|null} - Декодированный токен или null в случае ошибки
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

/**
 * Извлекает информацию из токена без проверки подписи
 * @param {string} token - JWT токен
 * @returns {Object|null} - Декодированный токен или null в случае ошибки
 */
exports.decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}; 