// Убираем мок логгера, так как его нет в проекте
// Настраиваем вместо этого консоль для подавления вывода в тестах
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

// Устанавливаем глобальные переменные для тестов
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'audio_streaming_test';

// Увеличиваем время таймаута для тестов
jest.setTimeout(30000); 