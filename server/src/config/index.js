require('dotenv').config();

module.exports = {
  // Настройки сервера
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Настройки базы данных
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'audio_streaming',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  // Настройки JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key', //a128d3dc-58b2-4e73-b7bf-68fb4c8e7123
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Настройки для хранения файлов
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    streamDir: process.env.STREAM_DIR || 'streams',
  },
  
  // Настройки CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Настройки HLS стриминга
  hls: {
    segmentDuration: 10, // длительность сегмента в секундах
    playlistSize: 6,     // количество сегментов в плейлисте
    mediaDirectory: 'media', // директория для медиа-сегментов
  }
}; 