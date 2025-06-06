// Mock для app.js для использования в фаззинг-тестах
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Создаем express приложение
const app = express();

// Базовые middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock middleware для аутентификации
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const secret = process.env.JWT_SECRET || 'test-secret-key';
      const decoded = jwt.verify(token, secret);
      
      req.user = {
        ...decoded,
        id: decoded.userId,
      };
    } catch (err) {
      // В случае ошибки проверки токена не устанавливаем req.user
    }
  }
  
  next();
});

// Mock routes для фаззинг тестов
app.post('/api/auth/register', (req, res) => {
  res.status(200).json({ success: true, message: 'Mock registration successful' });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({ 
    success: true, 
    token: jwt.sign({ userId: 1, role: 'user' }, process.env.JWT_SECRET || 'test-secret-key'),
    user: { id: 1, username: 'mockuser', email: 'mock@example.com' }
  });
});

app.get('/api/tracks/:id', (req, res) => {
  res.status(200).json({ id: req.params.id, title: 'Mock Track', artist: 'Mock Artist' });
});

app.get('/api/tracks', (req, res) => {
  res.status(200).json([
    { id: 1, title: 'Mock Track 1', artist: 'Mock Artist 1' },
    { id: 2, title: 'Mock Track 2', artist: 'Mock Artist 2' }
  ]);
});

app.post('/api/tracks', (req, res) => {
  res.status(201).json({ id: 100, ...req.body });
});

app.put('/api/tracks/:id', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.status(200).json({ id: req.params.id, ...req.body });
});

app.delete('/api/tracks/:id', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.status(200).json({ success: true, message: 'Track deleted successfully' });
});

// Mock routes для плейлистов
app.get('/api/playlists/:id', (req, res) => {
  res.status(200).json({ id: req.params.id, name: 'Mock Playlist' });
});

app.post('/api/playlists', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.status(201).json({ id: 100, name: req.body.name, userId: req.user.userId });
});

// Mock routes для воспроизведения
app.post('/api/playback/position', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.status(200).json({ success: true, message: 'Position saved' });
});

app.get('/api/playback/position', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.status(200).json({ trackId: 1, position: 30 });
});

// Mock routes для пользователей
app.get('/api/users/:id', (req, res) => {
  res.status(200).json({ id: req.params.id, username: 'Mock User' });
});

// Mock обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app; 