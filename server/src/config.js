const path = require('path');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env
dotenv.config();

// Устанавливаем порт из переменной окружения или по умолчанию
const PORT = process.env.PORT || 5000;

// Импорт настроек из config.json
const configFile = require('../config/config.json');
const env = process.env.NODE_ENV || 'development';
const dbConfig = configFile[env];

// Конфигурация приложения
module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: PORT,
  
  // Конфигурация базы данных
  database: {
    name: process.env.DB_NAME || dbConfig.database,
    user: process.env.DB_USER || dbConfig.username,
    password: process.env.DB_PASSWORD || dbConfig.password,
    host: process.env.DB_HOST || dbConfig.host,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  
  // Конфигурация JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'audio-streaming-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Пути для загрузки и стриминга файлов
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    streamDir: process.env.STREAM_DIR || 'streams',
  },
  
  // Настройки стриминга
  streaming: {
    segmentDuration: 10, // Длительность сегмента в секундах
    bitrate: '128k', // Битрейт аудио
  },
  
  // Настройки HLS
  hls: {
    segmentDuration: 10, // Длительность сегмента в секундах
    bitrate: '128k', // Битрейт аудио
  },
}; 