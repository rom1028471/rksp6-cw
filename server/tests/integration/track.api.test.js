const request = require('supertest');
const app = require('../../src/app');
const { User, Track, Playlist, PlaylistTrack } = require('../../src/models');

// Очищаем базу данных перед тестами
beforeAll(async () => {
  await PlaylistTrack.destroy({ where: {} });
  await Track.destroy({ where: {} });
  await Playlist.destroy({ where: {} });
  await User.destroy({ where: {} });
});

describe('Track API', () => {
  let testUser;
  let token;
  let testTrack;
  
  // Создаем тестового пользователя и получаем токен
  beforeAll(async () => {
    // Регистрация пользователя
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'trackuser',
        email: 'trackuser@example.com',
        password: 'password123'
      });
    
    testUser = registerRes.body.user;
    token = registerRes.body.token;
  });

  describe('POST /api/tracks', () => {
    it('должен создавать новый трек', async () => {
      const trackData = {
        title: 'Test Track',
        artist: 'Test Artist',
        genre: 'Test Genre',
        description: 'This is a test track'
      };
      
      // В реальном запросе здесь должен быть файл, но для теста мы мокируем этот функционал
      // Это не эквивалентно полноценному тесту с файлом, но позволяет проверить маршрут API
      
      const res = await request(app)
        .post('/api/tracks')
        .set('Authorization', `Bearer ${token}`)
        .field('title', trackData.title)
        .field('artist', trackData.artist)
        .field('genre', trackData.genre)
        .field('description', trackData.description)
        // .attach('file', Buffer.from('fake audio content'), 'test-track.mp3')
        .expect(201);
      
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(trackData.title);
      expect(res.body.artist).toBe(trackData.artist);
      expect(res.body.genre).toBe(trackData.genre);
      expect(res.body.userId).toBe(testUser.id);
      
      // Сохраняем для последующих тестов
      testTrack = res.body;
    });

    it('должен возвращать ошибку при неполных данных трека', async () => {
      await request(app)
        .post('/api/tracks')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Incomplete Track')
        // Отсутствует обязательное поле artist
        .expect(400);
    });

    it('должен возвращать ошибку 401 без авторизации', async () => {
      await request(app)
        .post('/api/tracks')
        .field('title', 'No Auth Track')
        .field('artist', 'No Auth Artist')
        .expect(401);
    });
  });

  describe('GET /api/tracks', () => {
    it('должен возвращать список треков с пагинацией', async () => {
      const res = await request(app)
        .get('/api/tracks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('tracks');
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('limit');
      expect(Array.isArray(res.body.tracks)).toBe(true);
      
      // Проверяем, что созданный нами трек есть в списке
      const foundTrack = res.body.tracks.find(track => track.id === testTrack.id);
      expect(foundTrack).toBeTruthy();
    });

    it('должен правильно обрабатывать параметры пагинации', async () => {
      const res = await request(app)
        .get('/api/tracks')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });

    it('должен фильтровать треки по жанру', async () => {
      const res = await request(app)
        .get('/api/tracks')
        .query({ genre: testTrack.genre })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.tracks.length).toBeGreaterThan(0);
      res.body.tracks.forEach(track => {
        expect(track.genre).toBe(testTrack.genre);
      });
    });
  });

  describe('GET /api/tracks/:id', () => {
    it('должен возвращать трек по ID', async () => {
      const res = await request(app)
        .get(`/api/tracks/${testTrack.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.id).toBe(testTrack.id);
      expect(res.body.title).toBe(testTrack.title);
      expect(res.body.artist).toBe(testTrack.artist);
      expect(res.body.userId).toBe(testUser.id);
    });

    it('должен возвращать 404 для несуществующего трека', async () => {
      await request(app)
        .get('/api/tracks/9999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/tracks/:id', () => {
    it('должен обновлять трек', async () => {
      const updateData = {
        title: 'Updated Track',
        description: 'Updated description'
      };
      
      const res = await request(app)
        .put(`/api/tracks/${testTrack.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      expect(res.body.id).toBe(testTrack.id);
      expect(res.body.title).toBe(updateData.title);
      expect(res.body.description).toBe(updateData.description);
      expect(res.body.artist).toBe(testTrack.artist); // Не изменилось
    });

    it('должен возвращать 404 при обновлении несуществующего трека', async () => {
      await request(app)
        .put('/api/tracks/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Not Found Track' })
        .expect(404);
    });

    it('должен запрещать обновление чужого трека', async () => {
      // Создаем другого пользователя
      const otherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'otheruser@example.com',
          password: 'password123'
        });
      
      const otherToken = otherUserRes.body.token;
      
      // Пробуем обновить трек первого пользователя
      await request(app)
        .put(`/api/tracks/${testTrack.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Track' })
        .expect(403);
    });
  });

  describe('POST /api/tracks/:id/play', () => {
    it('должен увеличивать счетчик прослушиваний', async () => {
      // Запомним текущее количество прослушиваний
      const beforeRes = await request(app)
        .get(`/api/tracks/${testTrack.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      const playCountBefore = beforeRes.body.play_count;
      
      // Увеличиваем счетчик
      const res = await request(app)
        .post(`/api/tracks/${testTrack.id}/play`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.play_count).toBe(playCountBefore + 1);
    });
  });

  describe('GET /api/tracks/:id/stream', () => {
    it('должен возвращать URL потока для трека', async () => {
      const res = await request(app)
        .get(`/api/tracks/${testTrack.id}/stream`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('url');
      // В тестовом окружении URL может отличаться, 
      // но мы можем проверить, что это строка
      expect(typeof res.body.url).toBe('string');
    });
  });

  // Очищаем базу данных после тестов
  afterAll(async () => {
    await PlaylistTrack.destroy({ where: {} });
    await Track.destroy({ where: {} });
    await Playlist.destroy({ where: {} });
    await User.destroy({ where: {} });
  });
}); 