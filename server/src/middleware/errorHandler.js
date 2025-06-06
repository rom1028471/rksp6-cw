// server/src/middleware/errorHandler.js

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Логирование ошибки для отладки (можно заменить на ваш логгер, если он есть)
  console.error(`[ErrorHandler] Error: ${err.message}, Status: ${statusCode}, Stack: ${err.stack}`);

  // Если ошибка от Sequelize (например, ошибка валидации)
  if (err.name && err.name.startsWith('Sequelize')) {
    statusCode = 400; // Bad Request
    message = err.errors && err.errors.length > 0 
              ? err.errors.map(e => e.message).join(', ') 
              : err.message;
  }
  
  // Обработка известных сообщений об ошибках для установки корректных статус-кодов
  if (err.message && typeof err.message === 'string') {
    if (err.message.toLowerCase().includes('не найден') || err.message.toLowerCase().includes('not found')) {
      statusCode = 404;
    } else if (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('доступ запрещен')) {
      // Проверяем, не является ли это уже ошибкой express-jwt
      if (err.name !== 'UnauthorizedError') {
        statusCode = 401; // Или 403, если это "Forbidden" без JWT проблемы
      }
    }
    // Добавьте другие проверки по необходимости
  }

  // Для ошибок JWT от express-jwt (они уже имеют name: 'UnauthorizedError' и status: 401)
  if (err.name === 'UnauthorizedError') {
    statusCode = err.status || 401; // Используем статус из ошибки, если он есть
    message = message || 'Невалидный токен или доступ запрещен'; // Используем существующее сообщение или дефолтное
  }

  // Если сообщение все еще не установлено и есть err.message
  if (!message && err.message) {
    message = err.message;
  }
  
  // Убедимся, что statusCode - это число
  if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
    console.error(`[ErrorHandler] Invalid statusCode: ${statusCode}, resetting to 500.`);
    statusCode = 500;
  }


  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: message || 'На сервере произошла ошибка',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler; 