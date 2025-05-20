const { FuzzedDataProvider } = require('@jazzer.js/core');
const request = require('supertest');
const app = require('../../src/app');

/**
 * Фаззинг-тест для API аутентификации
 * @param {Buffer} data - Буфер со случайными данными от фаззера
 */
async function authFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  
  try {
    // Генерируем случайные данные для регистрации
    const username = fuzzer.consumeString(10);
    const email = `${fuzzer.consumeString(8)}@${fuzzer.consumeString(5)}.com`;
    const password = fuzzer.consumeString(12);
    
    // Тестируем API регистрации
    await request(app)
      .post('/api/auth/register')
      .send({ username, email, password });
    
    // Тестируем API логина с разными комбинациями
    const loginData = {
      email: fuzzer.consumeBoolean() ? email : fuzzer.consumeString(15),
      password: fuzzer.consumeBoolean() ? password : fuzzer.consumeString(10),
      deviceId: fuzzer.consumeString(8),
      deviceName: fuzzer.consumeString(10),
      deviceType: fuzzer.consumeString(8)
    };
    
    await request(app)
      .post('/api/auth/login')
      .send(loginData);
  } catch (e) {
    // Игнорируем ошибки, т.к. это ожидаемая часть фаззинг-теста
  }
}

/**
 * Фаззинг-тест для API треков
 * @param {Buffer} data - Буфер со случайными данными от фаззера
 */
async function trackFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  
  try {
    // Генерируем случайный ID трека
    const trackId = fuzzer.consumeIntInRange(1, 1000);
    
    // Тестируем получение трека по ID
    await request(app)
      .get(`/api/tracks/${trackId}`);
    
    // Тестируем получение треков с разными параметрами
    const queryParams = new URLSearchParams();
    
    if (fuzzer.consumeBoolean()) {
      queryParams.append('page', fuzzer.consumeIntInRange(1, 100));
    }
    
    if (fuzzer.consumeBoolean()) {
      queryParams.append('limit', fuzzer.consumeIntInRange(1, 50));
    }
    
    if (fuzzer.consumeBoolean()) {
      queryParams.append('genre', fuzzer.consumeString(8));
    }
    
    if (fuzzer.consumeBoolean()) {
      queryParams.append('artist', fuzzer.consumeString(10));
    }
    
    await request(app)
      .get(`/api/tracks?${queryParams.toString()}`);
  } catch (e) {
    // Игнорируем ошибки, т.к. это ожидаемая часть фаззинг-теста
  }
}

/**
 * Фаззинг-тест для API плейлистов
 * @param {Buffer} data - Буфер со случайными данными от фаззера
 */
async function playlistFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  
  try {
    // Генерируем случайный ID плейлиста
    const playlistId = fuzzer.consumeIntInRange(1, 1000);
    
    // Тестируем получение плейлиста по ID
    await request(app)
      .get(`/api/playlists/${playlistId}`);
    
    // Тестируем изменение плейлиста
    if (fuzzer.consumeBoolean()) {
      await request(app)
        .put(`/api/playlists/${playlistId}`)
        .send({
          name: fuzzer.consumeString(15),
          description: fuzzer.consumeString(30),
          is_public: fuzzer.consumeBoolean()
        });
    }
    
    // Тестируем добавление/удаление трека из плейлиста
    const trackId = fuzzer.consumeIntInRange(1, 1000);
    
    if (fuzzer.consumeBoolean()) {
      await request(app)
        .post(`/api/playlists/${playlistId}/tracks`)
        .send({ trackId });
    } else {
      await request(app)
        .delete(`/api/playlists/${playlistId}/tracks/${trackId}`);
    }
  } catch (e) {
    // Игнорируем ошибки, т.к. это ожидаемая часть фаззинг-теста
  }
}

// Экспортируем фаззеры для использования
module.exports = {
  authFuzzer,
  trackFuzzer,
  playlistFuzzer
}; 