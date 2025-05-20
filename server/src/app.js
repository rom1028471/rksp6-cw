const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const { expressjwt } = require('express-jwt');

// Импорт маршрутов
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const trackRoutes = require('./routes/track.routes');
const playlistRoutes = require('./routes/playlist.routes');
const streamRoutes = require('./routes/stream.routes');
const playbackRoutes = require('./routes/playback');

// Импорт middleware
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

// Инициализация Express
const app = express();

// Настройка middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/streams', express.static(path.join(__dirname, '..', 'streams')));

// Настройка Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Audio Streaming API',
      version: '1.0.0',
      description: 'API для приложения потоковой передачи аудио',
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Защита маршрутов с помощью JWT
const jwtMiddleware = expressjwt({
  secret: config.JWT_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth',
}).unless({
  path: [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/validate',
    /^\/api-docs.*/,
    /^\/uploads.*/,
    /^\/streams.*/,
  ],
});

app.use(jwtMiddleware);

// Middleware для добавления пользователя в запрос
app.use(async (req, res, next) => {
  if (req.auth && req.auth.userId) {
    try {
      const userRepository = require('./repositories/user.repository');
      const user = await userRepository.findById(req.auth.userId);
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Регистрация маршрутов API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/playback', playbackRoutes);

// Обработка ошибок
app.use(errorHandler);

module.exports = app; 