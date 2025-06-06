const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Импорт маршрутов
const authRoutes = require('./routes/auth.routes');
const trackRoutes = require('./routes/track.routes');
const userRoutes = require('./routes/user.routes');
const playbackRoutes = require('./routes/playback');
const streamRoutes = require('./routes/stream.routes');

// Импорт конфигурации
const config = require('./config');
const db = require('./models');

// Инициализация приложения Express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Создание директорий для загрузки и стриминга, если они не существуют
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
const streamDir = path.join(__dirname, '..', process.env.STREAM_DIR || 'streams');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(streamDir)) {
  fs.mkdirSync(streamDir, { recursive: true });
}

// Статические файлы
app.use('/uploads', express.static(uploadDir));
app.use('/streams', express.static(streamDir));

// Swagger конфигурация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API для аудио стриминга',
      version: '1.0.0',
      description: 'API для потоковой передачи аудио с синхронизацией между устройствами'
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Локальный сервер'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playback', playbackRoutes);
app.use('/api/stream', streamRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Запуск сервера
const PORT = config.port;

db.sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
      console.log(`Swagger документация доступна по адресу: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Не удалось подключиться к базе данных:', err);
  }); 