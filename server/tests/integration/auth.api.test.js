const request = require('supertest');
const app = require('../../src/app'); // Предполагается, что экспресс-приложение экспортируется из app.js
const { User, DeviceSession } = require('../../src/models');

// Очищаем базу данных перед тестами
beforeAll(async () => {
  await DeviceSession.destroy({ where: {} });
  await User.destroy({ where: {} });
});

describe('Auth API', () => {
  let testUser;
  const userData = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123'
  };

  describe('POST /api/auth/register', () => {
    it('должен регистрировать нового пользователя', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(userData.username);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user).not.toHaveProperty('password');

      // Сохраняем для последующих тестов
      testUser = res.body.user;
    });

    it('должен возвращать ошибку при повторной регистрации с тем же email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email уже существует');
    });
  });

  describe('POST /api/auth/login', () => {
    it('должен авторизовать пользователя с правильными учетными данными', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
          deviceId: 'test-device-1',
          deviceName: 'Test Device',
          deviceType: 'Browser'
        })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('deviceSession');
      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user.username).toBe(testUser.username);
    });

    it('должен возвращать ошибку при неверном пароле', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
          deviceId: 'test-device-1'
        })
        .expect(401);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Неверный email или пароль');
    });

    it('должен возвращать ошибку при несуществующем email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
          deviceId: 'test-device-1'
        })
        .expect(401);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Неверный email или пароль');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      // Получаем токен для авторизации
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
          deviceId: 'test-device-1'
        });

      token = res.body.token;
    });

    it('должен возвращать данные текущего пользователя', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('должен возвращать ошибку 401 при отсутствии токена', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    it('должен возвращать ошибку 401 при недействительном токене', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;
    const deviceId = 'test-device-2';

    beforeAll(async () => {
      // Получаем токен для авторизации
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
          deviceId: deviceId,
          deviceName: 'Test Device 2',
          deviceType: 'Browser'
        });

      token = res.body.token;
    });

    it('должен успешно выполнять выход пользователя', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Выход выполнен успешно');

      // Проверяем, что сессия устройства деактивирована
      const deviceSession = await DeviceSession.findOne({
        where: {
          userId: testUser.id,
          deviceId
        }
      });

      expect(deviceSession).not.toBeNull();
      expect(deviceSession.isActive).toBe(false);
    });
  });

  // Очищаем базу данных после тестов
  afterAll(async () => {
    await DeviceSession.destroy({ where: {} });
    await User.destroy({ where: {} });
  });
}); 