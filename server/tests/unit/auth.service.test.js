const { mockUsers } = require('../mocks/user.mock');
const jwtUtils = require('../../src/utils/jwt.utils');

// Мокаем зависимости
jest.mock('../../src/repositories/user.repository', () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateLastActive: jest.fn()
}));

jest.mock('../../src/repositories/deviceSession.repository', () => ({
  findByDeviceAndUser: jest.fn(),
  update: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../src/utils/jwt.utils', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn()
}));

// Импортируем модули после мокирования
const userRepository = require('../../src/repositories/user.repository');
const deviceSessionRepository = require('../../src/repositories/deviceSession.repository');
const authService = require('../../src/services/auth.service');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      // Подготовка
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      // Мокаем возвращаемые значения
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        ...mockUsers[0],
        id: 3,
        username: userData.username,
        email: userData.email
      });

      jwtUtils.generateToken.mockReturnValue('test-token');

      // Действие
      const result = await authService.register(userData);

      // Проверка
      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(userRepository.findByUsername).toHaveBeenCalledWith(userData.username);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
      expect(jwtUtils.generateToken).toHaveBeenCalled();
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'test-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.username).toBe(userData.username);
      expect(result.user.email).toBe(userData.email);
    });

    it('должен выдать ошибку, если email уже существует', async () => {
      // Подготовка
      const userData = {
        username: 'newuser',
        email: 'testuser1@example.com', // Существующий email
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue(mockUsers[0]);

      // Действие и проверка
      await expect(authService.register(userData))
        .rejects
        .toThrow('Пользователь с таким email уже существует');
    });

    it('должен выдать ошибку, если username уже существует', async () => {
      // Подготовка
      const userData = {
        username: 'testuser1', // Существующий username
        email: 'newuser@example.com',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(mockUsers[0]);

      // Действие и проверка
      await expect(authService.register(userData))
        .rejects
        .toThrow('Пользователь с таким именем уже существует');
    });
  });

  describe('login', () => {
    it('должен успешно аутентифицировать пользователя', async () => {
      // Подготовка
      const credentials = {
        email: 'testuser1@example.com',
        password: 'password123'
      };

      const deviceInfo = {
        deviceId: 'device-123',
        deviceName: 'Test Device',
        deviceType: 'Desktop'
      };

      userRepository.findByEmail.mockResolvedValue(mockUsers[0]);
      deviceSessionRepository.findByDeviceAndUser.mockResolvedValue(null);
      deviceSessionRepository.create.mockResolvedValue({
        id: 1,
        userId: 1,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        isActive: true,
        toJSON: () => ({
          id: 1,
          userId: 1,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          isActive: true
        })
      });

      jwtUtils.generateToken.mockReturnValue('test-token');

      // Действие
      const result = await authService.login(credentials.email, credentials.password, deviceInfo);

      // Проверка
      expect(userRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(mockUsers[0].validatePassword).toHaveBeenCalledWith(credentials.password);
      expect(jwtUtils.generateToken).toHaveBeenCalled();
      expect(userRepository.updateLastActive).toHaveBeenCalledWith(1);
      expect(deviceSessionRepository.create).toHaveBeenCalled();

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'test-token');
      expect(result).toHaveProperty('deviceSession');
      expect(result.user).not.toHaveProperty('password');
    });

    it('должен выдать ошибку, если email неверный', async () => {
      // Подготовка
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue(null);

      // Действие и проверка
      await expect(authService.login(credentials.email, credentials.password))
        .rejects
        .toThrow('Неверный email или пароль');
    });

    it('должен выдать ошибку, если пароль неверный', async () => {
      // Подготовка
      const credentials = {
        email: 'testuser1@example.com',
        password: 'wrongpassword'
      };

      userRepository.findByEmail.mockResolvedValue(mockUsers[0]);
      mockUsers[0].validatePassword.mockReturnValueOnce(false);

      // Действие и проверка
      await expect(authService.login(credentials.email, credentials.password))
        .rejects
        .toThrow('Неверный email или пароль');
    });
  });

  describe('logout', () => {
    it('должен корректно выполнять выход пользователя', async () => {
      // Подготовка
      const userId = 1;
      const deviceId = 'device-123';
      const deviceSession = {
        id: 1,
        userId: 1,
        deviceId: 'device-123',
        isActive: true
      };

      deviceSessionRepository.findByDeviceAndUser.mockResolvedValue(deviceSession);
      deviceSessionRepository.update.mockResolvedValue([1]);

      // Действие
      const result = await authService.logout(userId, deviceId);

      // Проверка
      expect(deviceSessionRepository.findByDeviceAndUser).toHaveBeenCalledWith(deviceId, userId);
      expect(deviceSessionRepository.update).toHaveBeenCalledWith(1, {
        isActive: false,
        isPlaying: false
      });
      expect(result).toBe(true);
    });

    it('не должен выдавать ошибку, если сессия устройства не найдена', async () => {
      // Подготовка
      const userId = 1;
      const deviceId = 'non-existent-device';

      deviceSessionRepository.findByDeviceAndUser.mockResolvedValue(null);

      // Действие
      const result = await authService.logout(userId, deviceId);

      // Проверка
      expect(deviceSessionRepository.findByDeviceAndUser).toHaveBeenCalledWith(deviceId, userId);
      expect(deviceSessionRepository.update).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('validateToken', () => {
    it('должен корректно проверять валидный токен', async () => {
      // Подготовка
      const token = 'valid-token';
      const decoded = { userId: 1 };

      jwtUtils.verifyToken.mockReturnValue(decoded);
      userRepository.findById.mockResolvedValue(mockUsers[0]);

      // Действие
      const result = await authService.validateToken(token);

      // Проверка
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(token);
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
    });

    it('должен вернуть null, если токен недействителен', async () => {
      // Подготовка
      const token = 'invalid-token';

      jwtUtils.verifyToken.mockReturnValue(null);

      // Действие
      const result = await authService.validateToken(token);

      // Проверка
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(token);
      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('должен вернуть null, если пользователь не найден', async () => {
      // Подготовка
      const token = 'valid-token-unknown-user';
      const decoded = { userId: 999 };

      jwtUtils.verifyToken.mockReturnValue(decoded);
      userRepository.findById.mockResolvedValue(null);

      // Действие
      const result = await authService.validateToken(token);

      // Проверка
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith(token);
      expect(userRepository.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
}); 