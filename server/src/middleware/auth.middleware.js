const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

// Универсальный middleware для проверки аутентификации
const checkAuth = (options = { required: true }) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (options.required) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    // Если аутентификация не обязательна, просто идем дальше
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || config.jwt.secret;
    console.log(`[AUTH] Проверка токена с секретным ключом: ${secret.substring(0, 5)}...`);
    
    const decoded = jwt.verify(token, secret);
    
    // Добавляем информацию в req.user, делая доступными все возможные поля
    req.user = {
      ...decoded,
      id: decoded.userId,  // Дублируем userId как id для совместимости
    };
    
    console.log('[AUTH] Пользователь аутентифицирован:', { 
      userId: decoded.userId, 
      id: req.user.id,
      role: decoded.role 
    });
    
    next();
  } catch (err) {
    console.error('[AUTH] Ошибка проверки токена:', err.message);
    if (options.required) {
      return res.status(401).json({ message: 'Невалидный токен', error: err.message });
    }
    // Если токен невалиден, но аутентификация не обязательна, идем дальше
    console.warn('[AUTH] Получен невалидный токен, пользователь будет считаться гостем');
    next();
  }
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    next();
  };
};

const ownerMiddleware = (model) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        console.error('[OWNER] Ошибка доступа: отсутствует токен пользователя');
        return res.status(401).json({ message: 'Требуется авторизация' });
      }
      
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;
      
      console.log('[OWNER] Проверка владения:', { resourceId: id, userId, userRole });
      
      // Администратор может редактировать/удалять все
      if (userRole === 'admin') {
        console.log('[OWNER] Доступ предоставлен: пользователь - администратор');
        return next();
      }
      
      // Если модель - User, проверяем только соответствие пользователей
      if (model.name === 'User') {
        console.log('[OWNER] Проверка доступа к собственному профилю пользователя');
        
        // Преобразуем оба ID в числа для сравнения
        const requestedUserId = parseInt(id, 10);
        const currentUserId = parseInt(userId, 10);
        
        if (requestedUserId === currentUserId) {
          console.log('[OWNER] Доступ предоставлен: запрос к собственному профилю');
          return next();
        } else {
          console.error('[OWNER] Доступ запрещен: запрос к чужому профилю', {
            requestedUserId,
            currentUserId
          });
          return res.status(403).json({ message: 'Нет доступа к этому профилю' });
        }
      }
      
      const resource = await model.findByPk(id);
      
      if (!resource) {
        console.error('[OWNER] Ресурс не найден:', id);
        return res.status(404).json({ message: 'Ресурс не найден' });
      }
      
      // Логирование всех полей ресурса для отладки
      console.log('[OWNER] Данные ресурса:', JSON.stringify(resource.toJSON(), null, 2));
      
      // Проверяем разные варианты поля ID пользователя
      const ownerIdFromUserId = resource.userId;
      const ownerIdFromUser_id = resource.user_id;
      
      console.log('[OWNER] Данные для проверки:', { 
        userId, 
        ownerIdFromUserId, 
        ownerIdFromUser_id
      });
      
      // Преобразуем все значения в числа для корректного сравнения
      const numUserId = parseInt(userId, 10);
      const numOwnerIdFromUserId = parseInt(ownerIdFromUserId, 10);
      const numOwnerIdFromUser_id = parseInt(ownerIdFromUser_id, 10);
      
      // Проверяем владельца используя все возможные поля
      const isOwner = (
        !isNaN(numUserId) && 
        (!isNaN(numOwnerIdFromUserId) && numOwnerIdFromUserId === numUserId) || 
        (!isNaN(numOwnerIdFromUser_id) && numOwnerIdFromUser_id === numUserId)
      );
      
      if (isOwner) {
        console.log('[OWNER] Доступ предоставлен: пользователь является владельцем');
        next();
      } else {
        console.error('[OWNER] Доступ запрещен: пользователь не является владельцем');
        return res.status(403).json({ message: 'Нет доступа к этому ресурсу' });
      }
    } catch (error) {
      console.error('[OWNER] Ошибка при проверке владельца:', error);
      next(error);
    }
  };
};

module.exports = {
  checkAuth,
  roleMiddleware,
  ownerMiddleware,
}; 