const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

// Middleware для проверки JWT токена
exports.authMiddleware = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.split(' ')[1];
    
    // Проверяем токен
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Находим пользователя
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    
    // Добавляем пользователя в объект запроса
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Токен истек' });
    }
    return res.status(401).json({ message: 'Неверный токен' });
  }
};

// Middleware для проверки роли пользователя
exports.roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ message: 'Нет доступа' });
    }
  };
};

// Middleware для проверки владельца ресурса
exports.ownerMiddleware = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Требуется авторизация' });
      }
      
      const resourceId = req.params[paramName];
      if (!resourceId) {
        return res.status(400).json({ message: 'Не указан идентификатор ресурса' });
      }
      
      const resource = await model.findByPk(resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Ресурс не найден' });
      }
      
      // Если пользователь админ или владелец ресурса
      if (req.user.role === 'admin' || resource.userId === req.user.id) {
        req.resource = resource;
        next();
      } else {
        return res.status(403).json({ message: 'Нет доступа к этому ресурсу' });
      }
    } catch (error) {
      next(error);
    }
  };
}; 