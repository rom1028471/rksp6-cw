// Убираем мок логгера, так как его нет в проекте
// Настраиваем вместо этого консоль для подавления вывода в тестах
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

// Устанавливаем глобальные переменные для тестов
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'audio_streaming_test';
process.env.DB_HOST = 'localhost';
process.env.PORT = 3001;
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Увеличиваем время таймаута для тестов
jest.setTimeout(30000); 